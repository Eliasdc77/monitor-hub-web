# Diagrama Entidad-Relacion - Monitor-Hub Unimag

#### 1

#### N 1

#### 0..

#### 1

#### N

#### 1

#### N

#### 1

#### N

#### 1

#### N

#### 1

#### N

#### 1

#### N

#### 1

#### N

#### 1

#### N

#### 1

#### N

#### 1

#### 1 1

#### 0..

## [C] roles

```
PK id_rol INT UNSIGNED PK
nombre_rol VARCHAR(50) UNIQUE
descripcion TEXT
```
## [C] usuarios

```
PK id_usuario INT UNSIGNED PK
nombre VARCHAR(100)
correo VARCHAR(150) UNIQUE
contrasena VARCHAR(255)
FK id_rol INT UNSIGNED FK > roles
foto_perfil VARCHAR(255) NULL
fecha_registro DATETIME DEFAULT NOW
activo TINYINT(1) DEFAULT 1
```
## programas_academicos

```
PK id_programa INT UNSIGNED PK
nombre VARCHAR(150)
facultad VARCHAR(150)
```
## materias

```
PK id_materia INT UNSIGNED PK
nombre VARCHAR(150)
codigo VARCHAR(20) UNIQUE
FK id_programa INT UNSIGNED FK > prog.
semestre TINYINT UNSIGNED
```
## perfiles_monitor

```
PK id_perfil INT UNSIGNED PK
FK id_usuario INT UNSIGNED FK > users
FK id_programa INT UNSIGNED FK > prog.
semestre_actual TINYINT UNSIGNED
promedio DECIMAL(3,2)
descripcion TEXT
modalidad ENUM p/v/ambas
tarifa DECIMAL(10,2) 0=gratis
disponible TINYINT(1)
fecha_creacion DATETIME
```
## monitor_materias

```
PK id_monitor_mat INT UNSIGNED PK
FK id_perfil INT UNSIGNED FK > perfiles
FK id_materia INT UNSIGNED FK > materias
```
## solicitudes_tutoria

```
PK id_solicitud INT UNSIGNED PK
FK id_estudiante INT UNSIGNED FK > users
FK id_materia INT UNSIGNED FK > mat.
descripcion TEXT
modalidad ENUM
estado ENUM pendiente...
fecha_solicitud DATETIME
```
## sesiones_tutoria

```
PK id_sesion INT UNSIGNED PK
FK id_solicitud INT UNSIGNED FK > solic.
FK id_monitor INT UNSIGNED FK > perf.
fecha_hora DATETIME
duracion_min SMALLINT
lugar VARCHAR(200)
modalidad ENUM
estado ENUM prog/realiz
```
## calificaciones

```
PK id_calificacion INT UNSIGNED PK
FK id_sesion INT UNSIGNED FK > sesion
FK id_estudiante INT UNSIGNED FK > users
puntaje TINYINT 1-
comentario TEXT
fecha DATETIME
```
## notificaciones

```
PK id_notificacion INT UNSIGNED PK
FK id_usuario INT UNSIGNED FK > users
titulo VARCHAR(150)
mensaje TEXT
leida TINYINT(1) DEFAULT 0
fecha DATETIME
```
## LEYENDA

### [C] Tabla comun (Usuarios / Roles)

### Tabla personalizada del proyecto

### PK Clave Primaria

### FK Clave Foranea

### --- Relacion entre tablas

### Columnas en cada tabla:

```
Nombre campo: identificador del atributo
Tipo dato: VARCHAR / INT / ENUM ...
Nota: PK / FK / UNIQUE / NULL
```

