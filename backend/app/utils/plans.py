PLANS_SEED = [
    {
        "code": "BASIC",
        "name": "Basic",
        "description": "Perfect for single-location businesses just getting started.",
        "price_monthly": 1490.00,
        "price_yearly": 14300.00,          # billed annually
        "currency": "KES",
        "is_active": True,
        "is_public": True,
        "trial_days": 7,                   # 7-day self-serve trial
        "sort_order": 1,
        "limits": {
            "max_businesses": 1,
            "max_staff": 3,
            "max_products": 300,
            "max_customers": 200,
            "max_transactions_per_month": 1000,
            "max_invoices_per_month": 500,
            "data_retention_months": 6
        },
        "features": {
            "pos_and_sales": True,
            "invoicing": True,
            "basic_stock_tracking": True,
            "customer_management": True,
            "daily_sales_report": True,
            "pin_login": True,
            "csv_export": True,
            "email_support": True,

            # Explicitly disabled
            "multi_business": False,
            "receipt_customization": False,
            "expense_tracking": False,
            "advanced_reports": False,
            "staff_performance": False,
            "api_access": False,
            "audit_trail": False,
            "offline_mode": False,
            "priority_support": False
        }
    },
    {
        "code": "NDOVU",
        "name": "Ndovu",
        "description": "The recommended plan for growing businesses. Strength, memory, and reliability.",
        "price_monthly": 2499.00,
        "price_yearly": 29988.00,
        "currency": "KES",
        "is_active": True,
        "is_public": True,
        "trial_days": 7,                   # 7-day trial of Ndovu features
        "sort_order": 2,
        "limits": {
            "max_businesses": 5,
            "max_staff": None,             # Unlimited
            "max_products": 5000,
            "max_customers": 5000,
            "max_transactions_per_month": 15000,
            "max_invoices_per_month": 8000,
            "data_retention_months": 12
        },
        "features": {
            "pos_and_sales": True,
            "invoicing": True,
            "basic_stock_tracking": True,
            "full_inventory": True,
            "low_stock_alerts": True,
            "customer_management": True,
            "customer_credit": True,
            "expense_tracking": True,
            "multi_business": True,
            "receipt_customization": True,
            "advanced_reports": True,
            "profit_and_loss": True,
            "staff_performance": True,
            "pin_login": True,
            "csv_export": True,
            "pdf_export": True,
            "email_support": True,
            "whatsapp_support": True,
            "priority_support": True,
            "automatic_backups": True,

            # Still disabled
            "api_access": False,
            "audit_trail": "basic",        # or True/False + separate full_audit
            "offline_mode": "limited",
            "supplier_management": False,
            "batch_tracking": False,
            "custom_domain": False,
            "sso": False
        }
    },
    {
        "code": "ENTERPRISE",
        "name": "Enterprise",
        "description": "For complex multi-branch operations that need full control, compliance, and scale.",
        "price_monthly": 8990.00,          # Starting price
        "price_yearly": None,              # Custom
        "currency": "KES",
        "is_active": True,
        "is_public": True,
        "trial_days": 14,
        "sort_order": 3,
        "limits": {
            "max_businesses": None,        # Unlimited
            "max_staff": None,
            "max_products": None,
            "max_customers": None,
            "max_transactions_per_month": None,
            "max_invoices_per_month": None,
            "data_retention_months": 36
        },
        "features": {
            "pos_and_sales": True,
            "invoicing": True,
            "full_inventory": True,
            "low_stock_alerts": True,
            "customer_management": True,
            "customer_credit": True,
            "expense_tracking": True,
            "multi_business": True,
            "receipt_customization": True,
            "advanced_reports": True,
            "profit_and_loss": True,
            "staff_performance": True,
            "audit_trail": "full",
            "supplier_management": True,
            "purchase_orders": True,
            "batch_tracking": True,
            "api_access": True,
            "offline_mode": True,
            "custom_reports": True,
            "priority_support": True,
            "dedicated_account_manager": True,
            "phone_support": True,
            "whatsapp_support": True,
            "onboarding_training": True,
            "custom_domain": True,
            "white_label": True,
            "sso": True,
            "enhanced_security": True,
            "automatic_backups": True,
            "csv_export": True,
            "pdf_export": True
        }
    }
]