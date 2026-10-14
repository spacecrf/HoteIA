-- HoteIA - Script de Base de Datos
-- Versión 1.0
-- Este script crea la estructura de la base de datos y algunos datos iniciales.

-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS hoteia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hoteia_db;

-- Tabla: roles
-- Almacena los diferentes roles de usuario en el sistema.
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla: usuarios
-- Almacena la información de los usuarios registrados.
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- Tabla: habitaciones
-- Contiene toda la información sobre las habitaciones del hotel.
CREATE TABLE IF NOT EXISTS habitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_habitacion VARCHAR(10) NOT NULL UNIQUE,
    tipo_habitacion VARCHAR(50) NOT NULL,
    descripcion TEXT,
    capacidad INT NOT NULL,
    precio_noche DECIMAL(10, 2) NOT NULL,
    disponible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla: reservas
-- Registra todas las reservas realizadas por los usuarios.
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    habitacion_id INT NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    numero_huespedes INT NOT NULL,
    costo_total DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    INDEX idx_fechas (fecha_entrada, fecha_salida)
) ENGINE=InnoDB;

-- Tabla: pagos
-- Almacena la información de los pagos asociados a las reservas.
CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserv-id INT NOT NULL,
    metodo_pago VARCHAR(50),
    monto DECIMAL(10, 2) NOT NULL,
    estado_pago ENUM('pendiente', 'completado', 'fallido') NOT NULL DEFAULT 'pendiente',
    transaccion_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reserv-id) REFERENCES reservas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla: conversaciones_ia
-- Guarda el historial de las conversaciones con el asistente de IA.
CREATE TABLE IF NOT EXISTS conversaciones_ia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    session_id VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Inserción de datos iniciales (seeds)
-- Roles básicos para el sistema.
INSERT INTO roles (nombre, descripcion) VALUES ('cliente', 'Usuario estándar con capacidad para reservar.');
INSERT INTO roles (nombre, descripcion) VALUES ('admin', 'Usuario con privilegios de administrador para gestionar el sistema.');

-- Creación de un usuario administrador de ejemplo
-- La contraseña es "admin123" (hasheada con bcrypt)
INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES ('Admin', 'admin@hoteia.com', '$2b$10$E.pAVx.A/1pI1d2L9d9q5.xdzC9wzV6C/wzC9wzV6C/wzC9wzV6C/', 2);

-- Inserción de habitaciones de ejemplo
INSERT INTO habitaciones (numero_habitacion, tipo_habitacion, descripcion, capacidad, precio_noche) VALUES
('101', 'Individual', 'Habitación acogedora para una persona con vistas a la ciudad.', 1, 75.50),
('102', 'Doble', 'Habitación espaciosa con dos camas individuales.', 2, 110.00),
('201', 'Suite Junior', 'Lujosa suite con cama king-size y una pequeña sala de estar.', 2, 180.75),
('202', 'Familiar', 'Habitación amplia con una cama doble y dos individuales, ideal para familias.', 4, 195.00);

-- Mensaje de finalización
-- SELECT 'Base de datos HoteIA creada y poblada con datos iniciales.' AS status;
