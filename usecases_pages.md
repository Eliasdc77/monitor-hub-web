# Mapeo de Casos de Uso a Páginas

Este documento relaciona cada caso de uso definido en `usecase.md` con su respectiva página o componente en la aplicación web actual.

## Paquete 1: Acceso Público (Visitante)
| Caso de Uso | Página / Componente | Ruta Frontend | Estado |
| --- | --- | --- | --- |
| **Ver página de inicio** | `Home.tsx` | `/` | Implementado |
| **Explorar marketplace** | `Schedule.tsx` | `/schedule` | Implementado |
| **Registrarse** | `Register.tsx` | `/register` | Implementado |
| **Iniciar sesión** | `Login.tsx` | `/login` | Implementado |

## Paquete 2: Gestión de Cuenta (Estudiante)
| Caso de Uso | Página / Componente | Ruta Frontend | Estado |
| --- | --- | --- | --- |
| **Ver dashboard** | `Dashboard.tsx` | `/dashboard` | Implementado |
| **Ver perfil** | `Profile.tsx` | `/profile` | Implementado |
| **Editar perfil** | `Profile.tsx` | `/profile` | Implementado |
| **Cerrar sesión** | `Navbar.tsx` (Acción en Store) | N/A | Implementado |

## Paquete 3: Agendamiento de Tutorías (Estudiante)
| Caso de Uso | Página / Componente | Ruta Frontend | Estado |
| --- | --- | --- | --- |
| **Buscar tutor por materia o nombre** | `Schedule.tsx` | `/schedule` | Implementado |
| **Agendar tutoría** | `Schedule.tsx` | `/schedule` | Implementado |
| **Ver mis tutorías** | `MyTutorings.tsx` | `/my-tutorings` | Implementado |
| **Filtrar por estado** | `MyTutorings.tsx` | `/my-tutorings` | Implementado |
| **Cancelar tutoría** | `MyTutorings.tsx` | `/my-tutorings` | Implementado |

## Paquete 4: Gestión de Ofertas (Monitor)
| Caso de Uso | Página / Componente | Ruta Frontend | Estado |
| --- | --- | --- | --- |
| **Publicar oferta** | `Publish.tsx` | `/publish` | Implementado |
| **Ver mis ofertas** | `Publish.tsx` | `/publish` | Implementado |
| **Retirar oferta** | `Publish.tsx` | `/publish` | Implementado |
| **Ver reservas entrantes** | `Publish.tsx` | `/publish` | Implementado |
| **Actualizar estado de reserva** | `Publish.tsx` | `/publish` | Implementado |

## Paquete 5: Administración (Administrador)
| Caso de Uso | Página / Componente | Ruta Frontend | Estado |
| --- | --- | --- | --- |
| **Gestionar usuarios y roles** | `Admin.tsx` | `/admin` | Implementado |
| **Monitorear actividad general** | `Admin.tsx` | `/admin` | Implementado |

## Paquete 6: Casos PLUS
| Caso de Uso | Pagina / Componente | Ruta Frontend | Estado |
| --- | --- | --- | --- |
| **Autenticacion federada (Google OAuth2)** | `Login.tsx` (boton Google) | `/login` | Implementado |
| **Notificaciones transaccionales (Email)** | Backend (servicio de notificaciones) | N/A | Implementado |

## Justificacion tecnica (Casos PLUS)
- **Autenticacion federada (Google OAuth2):** Reduce friccion de ingreso, aprovecha validacion externa y habilita creacion automatica del perfil local.
- **Notificaciones transaccionales (Email/Mailtrap):** Canal de email transaccional para alertas automaticas ante cambios de estado y recordatorios.
