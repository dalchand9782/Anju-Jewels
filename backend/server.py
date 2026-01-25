from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', '')))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int

class CartItem(BaseModel):
    product_id: str
    quantity: int

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    payment_status: str = "pending"  # pending, completed, failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    shipping_address: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    shipping_address: dict

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        is_admin=False
    )
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.model_dump()
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.model_dump()
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product = Product(**product_data.model_dump())
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    
    await db.products.insert_one(product_dict)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing_product = await db.products.find_one({"id": product_id})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product.get('created_at'), str):
        updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    return categories

# Cart Routes
@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart:
        return {"items": []}
    
    # Fetch product details for each item
    items_with_details = []
    for item in cart.get('items', []):
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            items_with_details.append({
                "product": product,
                "quantity": item['quantity']
            })
    
    return {"items": items_with_details}

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    # Verify product exists
    product = await db.products.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": current_user.id})
    
    if not cart:
        cart = Cart(
            user_id=current_user.id,
            items=[item.model_dump()]
        )
        cart_dict = cart.model_dump()
        cart_dict['updated_at'] = cart_dict['updated_at'].isoformat()
        await db.carts.insert_one(cart_dict)
    else:
        # Update existing cart
        items = cart.get('items', [])
        item_exists = False
        
        for cart_item in items:
            if cart_item['product_id'] == item.product_id:
                cart_item['quantity'] += item.quantity
                item_exists = True
                break
        
        if not item_exists:
            items.append(item.model_dump())
        
        await db.carts.update_one(
            {"user_id": current_user.id},
            {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Item added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get('items', [])
    found = False
    
    for cart_item in items:
        if cart_item['product_id'] == item.product_id:
            if item.quantity <= 0:
                items.remove(cart_item)
            else:
                cart_item['quantity'] = item.quantity
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Item not in cart")
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/clear")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": current_user.id})
    return {"message": "Cart cleared"}

# Order Routes
@api_router.post("/orders/create")
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    # Get cart
    cart = await db.carts.find_one({"user_id": current_user.id})
    if not cart or not cart.get('items'):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total and create order items
    order_items = []
    total_amount = 0
    
    for item in cart['items']:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product and product['stock'] >= item['quantity']:
            order_item = OrderItem(
                product_id=product['id'],
                product_name=product['name'],
                quantity=item['quantity'],
                price=product['price']
            )
            order_items.append(order_item)
            total_amount += product['price'] * item['quantity']
        else:
            raise HTTPException(status_code=400, detail=f"Product {product['name'] if product else 'unknown'} out of stock")
    
    # Create Razorpay order
    razorpay_order = razorpay_client.order.create({
        "amount": int(total_amount * 100),  # Convert to paise
        "currency": "INR",
        "payment_capture": 1
    })
    
    # Create order
    order = Order(
        user_id=current_user.id,
        items=[item.model_dump() for item in order_items],
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        razorpay_order_id=razorpay_order['id']
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    return {
        "order_id": order.id,
        "razorpay_order_id": razorpay_order['id'],
        "amount": total_amount,
        "currency": "INR",
        "key_id": os.environ.get('RAZORPAY_KEY_ID', '')
    }

@api_router.post("/orders/verify-payment")
async def verify_payment(payment_data: PaymentVerify, current_user: User = Depends(get_current_user)):
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': payment_data.razorpay_order_id,
            'razorpay_payment_id': payment_data.razorpay_payment_id,
            'razorpay_signature': payment_data.razorpay_signature
        })
        
        # Update order
        await db.orders.update_one(
            {"id": payment_data.order_id},
            {"$set": {
                "payment_status": "completed",
                "status": "confirmed",
                "razorpay_payment_id": payment_data.razorpay_payment_id
            }}
        )
        
        # Update stock
        order = await db.orders.find_one({"id": payment_data.order_id})
        for item in order['items']:
            await db.products.update_one(
                {"id": item['product_id']},
                {"$inc": {"stock": -item['quantity']}}
            )
        
        # Clear cart
        await db.carts.delete_one({"user_id": current_user.id})
        
        return {"message": "Payment verified successfully", "order_id": payment_data.order_id}
    except Exception as e:
        await db.orders.update_one(
            {"id": payment_data.order_id},
            {"$set": {"payment_status": "failed"}}
        )
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    query = {"user_id": current_user.id} if not current_user.is_admin else {}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['user_id'] != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# Admin Routes
@api_router.get("/admin/analytics")
async def get_analytics(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get statistics
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"is_admin": False})
    
    # Calculate total revenue
    orders = await db.orders.find({"payment_status": "completed"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    
    # Get recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    # Category sales
    category_sales = {}
    for order in orders:
        for item in order.get('items', []):
            product = await db.products.find_one({"id": item['product_id']})
            if product:
                category = product['category']
                category_sales[category] = category_sales.get(category, 0) + (item['price'] * item['quantity'])
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders,
        "category_sales": category_sales
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def startup_db():
    # Create admin user if not exists
    admin_exists = await db.users.find_one({"email": "admin@luxejewel.com"})
    if not admin_exists:
        admin_user = User(
            email="admin@luxejewel.com",
            name="Admin",
            is_admin=True
        )
        admin_dict = admin_user.model_dump()
        admin_dict['password'] = hash_password("admin123")
        admin_dict['created_at'] = admin_dict['created_at'].isoformat()
        await db.users.insert_one(admin_dict)
        logger.info("Admin user created: admin@luxejewel.com / admin123")
    
    # Create sample products if none exist
    product_count = await db.products.count_documents({})
    if product_count == 0:
        sample_products = [
            # Earrings
            {
                "id": str(uuid.uuid4()),
                "name": "Rose Gold Drop Earrings",
                "description": "Elegant rose gold plated drop earrings with pearl accents. Perfect for special occasions.",
                "price": 2499,
                "category": "Earrings",
                "image_url": "https://images.unsplash.com/photo-1629297777138-6ae859d4d6df",
                "stock": 15,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Crystal Stud Earrings",
                "description": "Dainty crystal stud earrings with minimalist Korean design.",
                "price": 1299,
                "category": "Earrings",
                "image_url": "https://images.unsplash.com/photo-1617030557822-c8c35f07c60b",
                "stock": 20,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pearl Hoop Earrings",
                "description": "Classic hoop earrings adorned with freshwater pearls.",
                "price": 3499,
                "category": "Earrings",
                "image_url": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908",
                "stock": 12,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            # Rings
            {
                "id": str(uuid.uuid4()),
                "name": "Delicate Gold Band Ring",
                "description": "Minimalist gold band ring with subtle Korean aesthetic.",
                "price": 1899,
                "category": "Rings",
                "image_url": "https://images.unsplash.com/photo-1588909006332-2e30f95291bc",
                "stock": 18,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Vintage Rose Ring",
                "description": "Vintage-inspired rose gold ring with intricate details.",
                "price": 2799,
                "category": "Rings",
                "image_url": "https://images.unsplash.com/photo-1592752411501-b62f219cf9e2",
                "stock": 10,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Moonstone Cocktail Ring",
                "description": "Statement cocktail ring featuring a luminous moonstone centerpiece.",
                "price": 4599,
                "category": "Rings",
                "image_url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e",
                "stock": 8,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            # Necklaces
            {
                "id": str(uuid.uuid4()),
                "name": "Layered Chain Necklace",
                "description": "Delicate layered chain necklace in rose gold.",
                "price": 3299,
                "category": "Necklaces",
                "image_url": "https://images.pexels.com/photos/6889924/pexels-photo-6889924.jpeg",
                "stock": 14,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pendant Heart Necklace",
                "description": "Romantic heart pendant necklace with Korean charm.",
                "price": 2199,
                "category": "Necklaces",
                "image_url": "https://images.unsplash.com/photo-1629297777109-167b5d2bbba4",
                "stock": 16,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Baroque Pearl Necklace",
                "description": "Sophisticated baroque pearl necklace for elegant occasions.",
                "price": 5299,
                "category": "Necklaces",
                "image_url": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f",
                "stock": 7,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            # Bracelets
            {
                "id": str(uuid.uuid4()),
                "name": "Charm Bracelet Set",
                "description": "Delicate charm bracelet set with Korean-inspired charms.",
                "price": 1799,
                "category": "Bracelets",
                "image_url": "https://images.pexels.com/photos/7642066/pexels-photo-7642066.jpeg",
                "stock": 22,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Tennis Bracelet",
                "description": "Classic tennis bracelet with brilliant crystals.",
                "price": 3899,
                "category": "Bracelets",
                "image_url": "https://images.unsplash.com/photo-1588559674156-c5984ed49b1c",
                "stock": 11,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Bangle Set - Gold",
                "description": "Set of three minimalist gold bangles.",
                "price": 2599,
                "category": "Bracelets",
                "image_url": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a",
                "stock": 13,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            # Sets
            {
                "id": str(uuid.uuid4()),
                "name": "Bridal Jewelry Set",
                "description": "Complete bridal jewelry set including necklace, earrings, and bracelet.",
                "price": 12999,
                "category": "Sets",
                "image_url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338",
                "stock": 5,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Everyday Elegance Set",
                "description": "Perfect everyday jewelry set with earrings and necklace.",
                "price": 4999,
                "category": "Sets",
                "image_url": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a",
                "stock": 9,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.products.insert_many(sample_products)
        logger.info(f"Created {len(sample_products)} sample products")