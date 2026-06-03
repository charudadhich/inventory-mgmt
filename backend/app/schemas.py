import re
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PHONE_DIGITS_RE = re.compile(r"^\d{10}$")


class ProductBase(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=255)]
    sku: Annotated[str, Field(min_length=1, max_length=100)]
    price: Annotated[Decimal, Field(gt=0, decimal_places=2)]
    quantity_in_stock: Annotated[int, Field(ge=0)]


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Annotated[str | None, Field(default=None, min_length=1, max_length=255)] = None
    sku: Annotated[str | None, Field(default=None, min_length=1, max_length=100)] = None
    price: Annotated[Decimal | None, Field(default=None, gt=0, decimal_places=2)] = None
    quantity_in_stock: Annotated[int | None, Field(default=None, ge=0)] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CustomerBase(BaseModel):
    full_name: Annotated[str, Field(min_length=1, max_length=255)]
    email: EmailStr
    phone: Annotated[str, Field(min_length=10, max_length=10)]

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v.strip())
        if not PHONE_DIGITS_RE.match(digits):
            raise ValueError("Phone number must be exactly 10 digits")
        return digits


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: Annotated[int, Field(gt=0)]

    @field_validator("product_id")
    @classmethod
    def product_id_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("product_id must be positive")
        return v


class OrderCreate(BaseModel):
    customer_id: int
    items: Annotated[list[OrderItemCreate], Field(min_length=1)]

    @field_validator("customer_id")
    @classmethod
    def customer_id_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("customer_id must be positive")
        return v


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product_name: str | None = None
    product_sku: str | None = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    customer_name: str | None = None
    customer_email: str | None = None
    items: list[OrderItemResponse] = []


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[ProductResponse]
    low_stock_threshold: int = 10


class MessageResponse(BaseModel):
    message: str
