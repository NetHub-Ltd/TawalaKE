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


class BusinessIndustry(str, Enum):
    """
    High-level industry classification for a business location.

    Tuned for common Kenyan SME / retail contexts (dukas, pharmacies,
    hardware, services). Use OTHER when nothing fits; store a free-text
    detail in Business.config or a separate note field if needed.
    """

    # Retail & trade
    GENERAL_RETAIL = "GENERAL_RETAIL"          # minimart, duka, supermarket
    GROCERY_FOOD = "GROCERY_FOOD"              # fresh produce, food shop
    PHARMACY = "PHARMACY"                      # chemist / pharmacy
    HARDWARE = "HARDWARE"                      # building materials, tools
    ELECTRONICS = "ELECTRONICS"                # phones, appliances, accessories
    FASHION_APPAREL = "FASHION_APPAREL"        # clothes, shoes, textiles
    BEAUTY_COSMETICS = "BEAUTY_COSMETICS"      # salon products, cosmetics retail

    # Hospitality & food service
    RESTAURANT_CAFE = "RESTAURANT_CAFE"        # restaurant, café, fast food
    BAR_NIGHTLIFE = "BAR_NIGHTLIFE"            # bar, wines & spirits shop

    # Health & personal care services
    HEALTH_CLINIC = "HEALTH_CLINIC"            # clinic, dental, optical
    SALON_BARBER = "SALON_BARBER"              # salon, barbershop

    # Auto & transport
    AUTOMOTIVE = "AUTOMOTIVE"                  # garage, spare parts, car wash

    # Agriculture & related
    AGROVET = "AGROVET"                        # agrovet, farm inputs
    AGRICULTURE = "AGRICULTURE"                # produce aggregation, farm shop

    # Professional & other services
    PROFESSIONAL_SERVICES = "PROFESSIONAL_SERVICES"  # accounting, legal, agency
    EDUCATION = "EDUCATION"                    # tuition, training centre
    LOGISTICS = "LOGISTICS"                    # courier, transport, warehouse

    # Catch-all
    OTHER = "OTHER"