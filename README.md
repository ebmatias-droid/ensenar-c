# Enseñar C

Una escuela web interactiva, en español, para aprender el lenguaje C desde los primeros conceptos hasta la construcción de software de nivel profesional. Presenta una ruta progresiva, lecciones breves, ejemplos y comprobaciones de comprensión en una interfaz minimalista.

## Ruta de aprendizaje

El curso reúne 72 lecciones en 12 módulos:

1. **Primeros pasos:** qué es programar, herramientas, primer programa, compilación y errores.
2. **Fundamentos:** variables, tipos, expresiones, entrada, salida y decisiones.
3. **Control y funciones:** ciclos, funciones, arreglos, texto y descomposición de problemas.
4. **Datos y algoritmos:** estructuras básicas, búsqueda, ordenamiento y complejidad.
5. **Punteros y memoria:** direcciones, memoria dinámica, errores comunes y sanitizadores.
6. **C robusto:** estructuras, archivos, validación y herramientas de depuración.
7. **C avanzado:** calificadores, preprocesador, enlace, callbacks y diseño de APIs.
8. **Estructuras de datos:** listas, pilas, colas, árboles, tablas hash, heaps y grafos.
9. **Sistemas:** procesos, sistema operativo, compilación, herramientas y diseño portable.
10. **Redes y servidores:** TCP, protocolos, concurrencia, TLS, observabilidad y límites.
11. **Web con C:** HTTP, CGI, APIs, serialización y servicios web.
12. **Proyecto profesional:** diseño, pruebas, seguridad, documentación y publicación.

Cada lección explica una idea, muestra código, propone una práctica y permite comprobar la comprensión. El avance se guarda localmente y por cuenta en el navegador.

## Ejecutar localmente

Requisitos: macOS, Node.js 20 o posterior, zsh y ngrok para publicar el sitio.

```sh
npm start
```

Abre [http://localhost:4173](http://localhost:4173). Para usar el túnel configurado en este equipo, carga los aliases de zsh una vez y ejecuta:

```sh
source ~/.zshrc
ensenamec
```

Para detener el servidor y el túnel de esta app, ejecuta `pararc`. El dominio ngrok Free está compartido con Calibre, así que solo se puede mantener activo uno de esos túneles a la vez.

## Cuentas y privacidad

La primera ejecución crea una clave temporal de configuración para registrar la primera cuenta administradora. El script de inicio muestra la clave; úsala una sola vez y consérvala de forma segura. Luego se elimina.

Las cuentas, configuración y avisos se guardan en `.private/`, que Git ignora. Las contraseñas se almacenan como hashes scrypt con sal. Las sesiones usan cookies HttpOnly y SameSite; el curso requiere sesión, y la administración puede borrar cuentas para revocar sus sesiones. El avance de cada aprendiz se mantiene en el navegador asociado a su cuenta.

En este equipo, los avisos de nuevas cuentas se envían con Apple Mail a la dirección configurada en `.private/settings.json`. El mensaje incluye nombre y correo del nuevo usuario; nunca incluye la contraseña. El panel de administración muestra el estado del envío.

El servidor está diseñado para una instancia local de confianza detrás del túnel ngrok configurado. La base de cuentas es un archivo JSON local de una sola instancia; para una instalación multiusuario de producción, conviene reemplazarla con una base transaccional y desplegar detrás de HTTPS con procesos supervisados.

## Desarrollo

No se requieren dependencias de npm.

```sh
node --check server.js
node --check auth.js
node --check app.js
npm test
```

La suite de integración usa una carpeta temporal aislada y desactiva Apple Mail. No toca las cuentas ni los ajustes locales.

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para reportes, cambios y estilo de código. Consulta [SECURITY.md](SECURITY.md) para reportar vulnerabilidades.

## Licencia

Distribuido bajo Apache License 2.0. Consulta [LICENSE](LICENSE).
