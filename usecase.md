@startuml Monitor-HUB Casos de Uso

left to right direction

!theme plain
skinparam backgroundColor #FFFFFF
skinparam actorStyle awesome
skinparam defaultFontName Segoe UI
skinparam defaultFontSize 12
skinparam shadowing false
skinparam roundcorner 12

skinparam actor {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  FontStyle bold
}

skinparam usecase {
  BackgroundColor #CFE9C9
  BorderColor #000000
  FontColor #000000
  BorderThickness 1.5
  FontSize 11
}

skinparam package {
  BackgroundColor #FFFFFF
  BorderColor #000000
  FontColor #000000
  FontStyle bold
  FontSize 12
}

skinparam arrow {
  Color #000000
  FontColor #000000
  FontSize 10
  Thickness 1.5
}

actor "Visitante"     as Visitante
actor "Estudiante"    as Estudiante
actor "Monitor"       as Monitor
actor "Administrador" as Admin

Estudiante --|> Visitante
Monitor    --|> Estudiante
Admin      --|> Monitor


package "Acceso Publico" as PKG1 {
  usecase "Ver pagina de inicio" as UC_Home
  usecase "Explorar marketplace" as UC_Marketplace
  usecase "Registrarse"          as UC_Register
  usecase "Iniciar sesion"       as UC_Login
}


package "Gestion de Cuenta" as PKG2 {
  usecase "Ver dashboard"  as UC_Dashboard
  usecase "Ver perfil"     as UC_Profile
  usecase "Editar perfil"  as UC_EditProfile
  usecase "Cerrar sesion"  as UC_Logout
}


package "Agendamiento de Tutorias" as PKG3 {
  usecase "Buscar tutor\npor materia o nombre" as UC_Search
  usecase "Agendar tutoria"                    as UC_Book
  usecase "Ver mis tutorias"                   as UC_MyBookings
  usecase "Filtrar por estado"                 as UC_FilterBookings
  usecase "Cancelar tutoria"                   as UC_CancelBooking
}


package "Gestion de Ofertas" as PKG4 {
  usecase "Publicar oferta"               as UC_CreateOffer
  usecase "Ver mis ofertas"               as UC_MyOffers
  usecase "Retirar oferta"                as UC_DeactivateOffer
  usecase "Ver reservas entrantes"        as UC_IncomingBookings
  usecase "Actualizar estado\nde reserva" as UC_UpdateBooking
}


package "Administracion" as PKG5 {
  usecase "Gestionar usuarios\ny roles"   as UC_ManageUsers
  usecase "Monitorear\nactividad general" as UC_Monitor
}


package "Casos PLUS" as PKG6 {
  usecase "Autenticacion federada (Google OAuth2)" as UC_SSO
  usecase "Notificaciones transaccionales (Email)" as UC_Notifications
}


Visitante  -down-> PKG1

Estudiante -down-> PKG2
Estudiante -down-> PKG3

Monitor    -down-> PKG4

Admin      -down-> PKG5

Visitante  -down-> PKG6
Estudiante -down-> PKG6
Monitor    -down-> PKG6


UC_Book           ..> UC_Search           : <<include>>
UC_FilterBookings ..> UC_MyBookings       : <<include>>
UC_CancelBooking  ..> UC_MyBookings       : <<include>>
UC_EditProfile    ..> UC_Profile          : <<include>>
UC_UpdateBooking  ..> UC_IncomingBookings : <<include>>
UC_MyOffers       ..> UC_CreateOffer      : <<extend>>
UC_Dashboard      ..> UC_MyBookings       : <<include>>
UC_Dashboard      ..> UC_Marketplace      : <<include>>
UC_Login          ..> UC_SSO              : <<extend>>
UC_Register       ..> UC_SSO              : <<extend>>
UC_Book           ..> UC_Notifications    : <<include>>
UC_UpdateBooking  ..> UC_Notifications    : <<include>>
UC_CancelBooking  ..> UC_Notifications    : <<include>>

@enduml