from fastapi import APIRouter, HTTPException, status, Response, Request, Depends
from app.models import User, Family, FamilyMember, FamilyMembership
from app.schemas import UserOut, TOTP, TOTPSetup, TOTPVerifyRequest, LoginForm, RegisterForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.config import settings
from app.security.passwords import hash_password, verify_password
from app.security.encryption import encrypt_secret, decrypt_secret
from app.auth.session import store_session, set_auth_cookie, clear_auth_cookie, new_sid, redis_client
from app.auth.dependencies import get_current_user, get_user_by_id, totp_ok
import pyotp, secrets

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(response: Response, form: RegisterForm, db: AsyncSession = Depends(get_db)):
    if (await db.scalars(select(User).where(User.email == form.email))).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Correo electrónico ya registrado")
    
    try:
        new_user = User(
            email=form.email,
            first_name=form.first_name,
            last_name=form.last_name,
            password_hash=hash_password(form.password)
        )
        db.add(new_user)
        await db.flush() # Get the new_user.id before the commit

        # Create the Family automatically
        new_family = Family(name=form.family_name, owner_id=new_user.id)

        db.add(new_family)
        await db.flush() # Get the new_family.id

        # Create the FamilyMembership link
        new_membership = FamilyMembership(
            user_id=new_user.id,
            family_id=new_family.id,
            role='owner'
        )
        db.add(new_membership)

        # Commit the transaction
        await db.commit()
    
    except SQLAlchemyError as e:
        # Roll back all the changes
        await db.rollback()
        print(f"Error de SQLAlchemy: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error del servidor: intenta crear la cuenta mas tarde")

    sid = new_sid()
    await store_session(sid, new_user.id)
    set_auth_cookie(response, sid)
    
    return {"message": "Cuenta y familia creadas correctamente"}

@router.post("/login")
async def login(response: Response, form: LoginForm, db: AsyncSession = Depends(get_db)):
    user = (await db.scalars(select(User).where(User.email == form.email))).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo electrónico o contraseña incorrectos")
    
    # If the user has TOTP enabled send preauth token
    if user.is_totp_enabled:
        tmp_token = secrets.token_urlsafe(32)
        await redis_client.setex(f"pre:{tmp_token}", 360, user.id)  # Valid for 6 min
        return {"requires_2fa": True, "token": tmp_token}
    
    sid = new_sid()
    await store_session(sid, user.id)
    set_auth_cookie(response, sid)
    
    return {"message": "Inicio de sesión exitoso"}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response):
    sid = request.cookies.get(settings.COOKIE_NAME)
    if sid: await redis_client.delete(f"sid:{sid}")
    clear_auth_cookie(response)

@router.get("/me", response_model=UserOut)
async def get_current_user_info(user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(FamilyMembership).where(
        FamilyMembership.user_id == user.id
    ).options(joinedload(FamilyMembership.family))

    memberships = (await db.scalars(stmt)).all()

    families_summary = []
    for mem in memberships:
        if mem.family:
            families_summary.append({
                "id": mem.family.id,
                "name": mem.family.name,
                "role": mem.role
            })

    user_response = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "families": families_summary
    }
    
    return user_response

# 2fa login verification
@router.post("/2fa/verify", status_code=status.HTTP_204_NO_CONTENT)
async def tfa_verify(data: TOTP, response: Response, db: AsyncSession = Depends(get_db)):
    user_id = await redis_client.get(f"pre:{data.token}")
    if not user_id: raise HTTPException(401, "Flujo de autenticacion expiro")

    user = await get_user_by_id(int(user_id), db)
    if not totp_ok(decrypt_secret(user.totp_secret), data.code): raise HTTPException(401, "Codigo invalido")
    await redis_client.delete(f"pre:{data.token}") # delete pre_auth token

    sid = new_sid()
    await store_session(sid, user.id)
    set_auth_cookie(response, sid)

# 2FA setup endpoints
@router.post("/2fa/setup", response_model=TOTPSetup)
async def tfa_setup(user: User = Depends(get_current_user)):
    if user.is_totp_enabled:
        raise HTTPException(status_code=400, detail="2FA ya esta habilitado")
    
    secret = pyotp.random_base32()
    
    otp_auth_url = pyotp.TOTP(secret).provisioning_uri(
        name=user.email, issuer_name="SaludHogar"
    )
    
    # Return the secret and URL
    return {"secret": secret, "otp_auth_url": otp_auth_url}

@router.post("/2fa/verify-setup")
async def verify_and_enable_2fa(
    request: TOTPVerifyRequest,  # JSON containing secret and totp_code
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if user.is_totp_enabled:
        raise HTTPException(status_code=400, detail="2FA ya esta habilitado")
    
    # Verify the TOTP code with the provided secret
    totp = pyotp.TOTP(request.secret)
    if not totp.verify(request.totp_code, valid_window=1):
        raise HTTPException(status_code=400, detail="Codigo invalido")
    
    # Only now store the secret and enable 2FA
    user.totp_secret = encrypt_secret(request.secret)
    user.is_totp_enabled = True
    
    await db.commit()
    await db.refresh(user)
    
    return {"message": "2FA habilitado satisfactoriamente"}