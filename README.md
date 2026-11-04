# C / escuela

**Aprende programación desde cero y avanza hacia proyectos que se parecen al trabajo profesional.** Una escuela web en español, minimalista y de acceso libre, con rutas seleccionables y progreso guardado en el navegador de cada estudiante.

> C / escuela es el nombre de la escuela y de su ruta principal. También puedes aprender Python, Java, Lua, HTML + CSS, Swift, JavaScript y TypeScript.

## Contenido

- [Probar la escuela](#probar-la-escuela)
- [Rutas de aprendizaje](#rutas-de-aprendizaje)
- [Cómo funciona el progreso](#cómo-funciona-el-progreso)
- [Tecnologías y estructura](#tecnologías-y-estructura)
- [Desarrollo local](#desarrollo-local)
- [Privacidad y acceso](#privacidad-y-acceso)
- [Licencia y permisos](#licencia-y-permisos)

## Probar la escuela

Abre la instancia pública de este equipo: [C / escuela](https://ferocious-unheated-varied.ngrok-free.dev). El enlace depende de que el equipo y el túnel ngrok estén activos.

Al abrir la página, agrega las rutas que te interesan con **+ Agregar**. Usa **Abrir ruta** para cambiar de curso. Puedes mantener varias rutas en tu escuela a la vez; cada una tiene su propio mapa y avance.

## Rutas de aprendizaje

Cada ruta parte de los conceptos básicos y progresa por sintaxis, estructuras de datos, diseño, herramientas, calidad, seguridad y un proyecto integrador. El curso de C es la ruta principal y más extensa; las demás rutas ofrecen un panorama progresivo desde los primeros programas hasta prácticas y proyectos de nivel profesional.

| Ruta | Lecciones | Temas de la ruta |
|---|---:|---|
| C | 72 | Fundamentos, memoria, estructuras, sistemas, redes, servidores y proyecto profesional |
| Python | 24 | Sintaxis, datos, automatización, APIs, persistencia y servicios |
| Java | 24 | Tipos, objetos, colecciones, APIs, concurrencia y calidad |
| Lua | 24 | Sintaxis, tablas, funciones, scripting e integración con aplicaciones |
| HTML + CSS | 24 | Documentos web, semántica, accesibilidad, diseño adaptable y publicación |
| Swift | 24 | Tipos, concurrencia, SwiftUI, networking y apps nativas |
| JavaScript | 24 | Fundamentos, navegador, DOM, Node.js, APIs y aplicación full stack |
| TypeScript | 24 | Tipos, genéricos, validación, APIs, arquitectura y aplicación full stack |

Una lección introduce una idea, explica un ejemplo, propone práctica y cierra con una pregunta de comprensión. Las rutas avanzadas cubren herramientas habituales de equipos profesionales, como control de versiones, pruebas, depuración, seguridad, despliegue y documentación.

## Cómo funciona el progreso

- Las rutas que agregas y la ruta abierta se recuerdan en el almacenamiento local del navegador.
- Cada lenguaje guarda sus lecciones por separado en la computadora y perfil de navegador que utilizas.
- La aplicación no crea cuentas ni transmite el progreso al servidor; no se sincroniza entre dispositivos.
- El progreso puede perderse si borras los datos del sitio, usas otro navegador o abres la página en otro perfil.

## Tecnologías y estructura

Proyecto estático sin dependencias externas de npm. El servidor Node.js integrado entrega una lista permitida de archivos y ngrok puede exponer el puerto local.

```text
index.html      Estructura de la escuela y controles
style.css       Interfaz adaptable, minimalista y monocromática
app.js          Selección de rutas, progreso y experiencia de lecciones
courses.js      Currículos de Python, Java, Lua, HTML + CSS, Swift, JavaScript y TypeScript
server.js       Servidor HTTP local con lista de archivos permitidos
start.sh        Arranque local y gestión del túnel ngrok
stop.sh         Detención del servidor y del túnel de esta escuela
```

## Desarrollo local

Requisitos: Node.js 20 o posterior. Para compartir la instancia desde este equipo, instala y configura ngrok.

```sh
npm start
```

Abre [http://localhost:4173](http://localhost:4173). En este equipo, los aliases de zsh permiten activar y detener el sitio con:

```sh
source ~/.zshrc
ensenamec
pararc
```

El túnel ngrok Free de este equipo comparte su dominio con Calibre; solo una de las aplicaciones puede usarlo a la vez.

Para comprobar la sintaxis de JavaScript:

```sh
node --check server.js
node --check app.js
node --check courses.js
```

## Privacidad y acceso

El contenido es de acceso libre y no requiere registro. Cualquier persona con la URL pública activa puede entrar. El avance permanece en el almacenamiento local del navegador; no guardes contraseñas, tokens ni información sensible en la app.

## Licencia y permisos

El material original de este repositorio se ofrece **All Rights Reserved**. El sitio público permite el uso personal de las lecciones; no se concede permiso para copiar, modificar, redistribuir, alojar o explotar comercialmente el código o los materiales. Para solicitar una autorización, consulta [LICENSE](LICENSE).

El contenido previo del historial de Git se publicó cuando el repositorio incluía Apache License 2.0. La actualización de la licencia del estado actual del proyecto no altera automáticamente los derechos concedidos sobre versiones anteriores. Además, al mantener el repositorio público, se aplican los permisos que GitHub describe para ver y bifurcar repositorios públicos dentro de su servicio. Consulta los [términos de GitHub para usuarios](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) y las condiciones de la [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.html) que estuvieron incluidas en versiones anteriores.
