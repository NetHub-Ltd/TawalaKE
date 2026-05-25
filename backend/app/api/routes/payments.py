from fastapi import APIRouter

router = APIRouter()

@router.post('/stk-push')
async def stk_push():
    return {"message": "STK Push initiated"}


@router.post('/confirmation')
async def confirmation():
    return {"message": "Confirmation received"}

@router.post('/validation')
async def validation():
    return {"message": "Validation received"}