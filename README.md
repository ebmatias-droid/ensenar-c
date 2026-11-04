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

## Acceso y progreso

El curso es de acceso libre: no hay registro, contraseña, sesión ni panel de cuentas. Cualquier persona que tenga el enlace puede abrir las lecciones. El avance se guarda en el almacenamiento local del navegador y no se sincroniza entre dispositivos.

Al publicar esta instancia mediante ngrok, quien tenga el enlace público puede acceder al contenido del curso.

## Desarrollo

No se requieren dependencias de npm.

```sh
node --check server.js
node --check app.js
npm test
```

La suite de integración usa una carpeta temporal aislada y desactiva Apple Mail. No toca las cuentas ni los ajustes locales.

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para reportes, cambios y estilo de código. Consulta [SECURITY.md](SECURITY.md) para reportar vulnerabilidades.

## Licencia

Distribuido bajo Apache License 2.0. Consulta [LICENSE](LICENSE).
