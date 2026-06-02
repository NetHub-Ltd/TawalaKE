from enum import Enum


# =========================================================
# CATEGORY TYPE (DB CONTROLLED)
# =========================================================
class CategoryType(str, Enum):
    GENERAL = "general"
    DRUG = "drug"
    FOOD = "food"
    FUEL = "fuel"
    SERVICE = "service"


# =========================================================
# SALE STATUS (FINANCIAL STATE MACHINE)
# =========================================================
# class SaleStatus(str, Enum):
#     PENDING = "pending"
#     COMPLETED = "completed"
#     CANCELLED = "cancelled"
#     REFUNDED = "refunded"


# =========================================================
# PAYMENT METHOD (RECONCILIATION CRITICAL)
# =========================================================
class PaymentMethod(str, Enum):
    CASH = "cash"
    MPESA = "mpesa"
    CARD = "card"
    BANK = "bank"



# =========================================================
# PRODUCT ATTRIBUTE KEYS (LIGHT CONSTRAINT LAYER)
# =========================================================
class ProductAttributeKey(str, Enum):
    """
    Optional: improves IDE autocomplete + consistency.

    NOTE:
    - This does NOT restrict flexibility
    - It only standardizes common fields
    """
    EXPIRY_DATE = "expiry_date"
    BATCH_NUMBER = "batch_number"
    LITRES = "litres"
    KGS = "kgs"
    SERIAL_NUMBER = "serial_number"