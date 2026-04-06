# Arquitectura del Modelo de Datos: Energy Box CRM

Este documento describe la arquitectura del modelo de datos de la aplicación backend de Energy Box CRM. La aplicación está construida con Django y se organiza en varios módulos que representan las entidades principales del negocio.

## 1. Arquitectura General

El modelo de datos se centra en la entidad **`User`**, que es el modelo principal y representa a todas las personas que interactúan con el sistema: administradores, personal y clientes. Las demás entidades principales se relacionan directa o indirectamente con el usuario.

- **`users`**: Contiene el modelo `User` personalizado, que extiende el `AbstractUser` de Django. Este modelo es el corazón del sistema y almacena información de identificación, contacto, médica y de membresía.
- **`attendance`**: Gestiona el registro de asistencias. El modelo `Attendance` relaciona a un `User` (el cliente que asiste) con una `TrainingClass` (la clase a la que asiste) y un `User` (el entrenador que imparte la clase).
- **`payments`**: Se encarga de la facturación. El modelo `Payment` registra los pagos realizados por los usuarios, y cada pago está asociado a un `Plan` que define los beneficios de la membresía (duración, límite de clases, etc.).
- **`customers`**: Aunque existe la carpeta, el modelo `customers/models.py` está vacío, lo que indica que toda la lógica de clientes se ha centralizado en el modelo `User` con el rol de `CLIENT`.

## 2. Descripción de Modelos

A continuación se detalla cada modelo, sus campos y sus relaciones.

### 2.1. `users.models.User`

Este modelo representa a una persona en el sistema.

- **Campos Clave**:
    - `role`: Define el tipo de usuario (`ADMIN`, `STAFF`, `CLIENT`).
    - `document_type` y `document_number`: Para identificación única (cédula, RIF, etc.).
    - `internal_code`: Un código único generado para los clientes (ej. `C0001`), utilizado para la asistencia por OCR.
    - `phone_number`, `address`: Datos de contacto.
    - `emergency_contact_name`, `emergency_contact_phone`, `medical_conditions`, `blood_type`: Información médica y de emergencia.
    - `remaining_classes`: El número de clases que le quedan al cliente. Se actualiza con cada asistencia y pago.
    - `membership_status`: El estado de la membresía (`ACTIVE`, `EXPIRED`, `DEBTOR`).
    - `balance`: Saldo monetario del cliente.
    - `last_attendance_date`: La fecha de la última asistencia del cliente.

- **Relaciones**:
    - `attendances`: Relación inversa desde `Attendance`. Un usuario tiene muchos registros de asistencia.
    - `payments`: Relación inversa desde `Payment`. Un usuario tiene muchos pagos.
    - `classes_taught`: Relación inversa desde `Attendance`. Un usuario (con rol `STAFF` o `ADMIN`) puede haber impartido muchas clases.

### 2.2. `attendance.models.TrainingClass`

Representa una clase que se ofrece en el gimnasio.

- **Campos Clave**:
    - `name`: Nombre de la clase (ej. "Crossfit").
    - `schedule_time`: Horario de la clase.
    - `is_active`: Para activar o desactivar clases del catálogo.

### 2.3. `attendance.models.Attendance`

Registra la asistencia de un cliente a una clase.

- **Campos Clave**:
    - `timestamp`: Fecha y hora de la asistencia.
    - `entry_method`: Cómo se registró la asistencia (`MANUAL`, `WHATSAPP`, `QR`).
    - `is_debt`: Se marca como `True` si el cliente asiste sin tener clases disponibles.

- **Relaciones**:
    - `user`: `ForeignKey` al `User` que asiste a la clase.
    - `trainer`: `ForeignKey` al `User` (entrenador) que imparte la clase.
    - `training_class`: `ForeignKey` a la `TrainingClass` a la que se asistió.

### 2.4. `payments.models.Plan`

Define un plan de membresía.

- **Campos Clave**:
    - `codPlan`: Código único del plan (ej. "MENS-12").
    - `name`: Nombre del plan.
    - `price`: Precio del plan.
    - `duration_days`: Duración en días del plan.
    - `class_limit`: Número de clases que incluye el plan.

### 2.5. `payments.models.Payment`

Registra un pago realizado por un usuario.

- **Campos Clave**:
    - `amount`, `currency`, `exchange_rate`: Detalles del monto del pago.
    - `payment_date`: Fecha en que el cliente realizó el pago.
    - `report_date`: Fecha en que el personal registró el pago en el sistema.
    - `end_date`: Fecha de vencimiento de la membresía asociada al pago.
    - `method`, `reference`, `bank_origin`: Detalles del método de pago.

- **Relaciones**:
    - `user`: `ForeignKey` al `User` que realiza el pago.
    - `plan`: `ForeignKey` al `Plan` que se está comprando. La lógica de negocio en el método `save` de este modelo actualiza el campo `remaining_classes` del usuario basándose en el `class_limit` del plan.
