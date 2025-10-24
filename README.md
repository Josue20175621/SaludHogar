# Prueba de notificaciones push usando Firebase Cloud Messaging

* Agrega un endpoint **/auth/push/fcm-token** para registrar un **FCM Token**, el FCM token se envia al backend, si el cliente acepta recibir notificaciones al iniciar sesion.

* Agrega el modelo **FCMTokenModel** que crea una tabla llamada **fcm_tokens** y los esquemas de Pydantic **FCMToken** y **NotificationRequest**

* El archivo **firebase_config.py** configura Firebase, necesita una llave privada en un archivo JSON que se descarga desde el Firebase Console, ese archivo se debe guardar en el folder **backend**, gitignore lo encuentra como **serviceAccountKey.json**

* El componente NotificationHandler envia el **FCM Token** al backend