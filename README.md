# C / escuela

**Una escuela web interactiva para aprender programación desde cero y avanzar hacia proyectos prácticos.**

La aplicación ofrece rutas de aprendizaje en C, Python, Java, Lua, HTML y CSS, Swift, JavaScript y TypeScript. El progreso se guarda localmente en el navegador.

## Rutas de aprendizaje

| Ruta | Lecciones |
|---|---:|
| C | 72 |
| Python | 24 |
| Java | 24 |
| Lua | 24 |
| HTML + CSS | 24 |
| Swift | 24 |
| JavaScript | 24 |
| TypeScript | 24 |

Cada lección presenta conceptos, ejemplos y ejercicios de comprensión.

## Cómo funciona el progreso

- Las rutas seleccionadas y el avance se guardan en el almacenamiento local del navegador.
- El progreso no se sincroniza entre dispositivos.
- Borrar los datos del sitio o cambiar de perfil del navegador puede eliminar el avance.
- La aplicación no requiere crear una cuenta.

## Tecnología y estructura

El proyecto utiliza Node.js y archivos estáticos, sin dependencias externas de npm para servir la aplicación.

```text
index.html      Estructura de la escuela
style.css       Interfaz adaptable
app.js          Navegación y progreso de las lecciones
courses.js      Contenido de las rutas de aprendizaje
server.js       Servidor HTTP local
start.sh        Ayuda para iniciar el entorno local
stop.sh         Ayuda para detener el entorno local
```

## Requisitos

- Node.js 20 o posterior

## Desarrollo local

Instala las dependencias del proyecto (si corresponde) e inicia el servidor:

```sh
npm start
```

Abre [http://localhost:4173](http://localhost:4173).

Para comprobar la sintaxis de los archivos JavaScript:

```sh
node --check server.js
node --check app.js
node --check courses.js
```

## Publicación y privacidad

El servidor está diseñado para ejecutarse localmente. Si decides publicar una instancia, configura tu propio alojamiento, dominio y controles de acceso. El progreso permanece en el navegador del estudiante; no introduzcas contraseñas, tokens ni información sensible.

## Licencia

El material de este repositorio se marca como **All Rights Reserved**. Consulta [LICENSE](LICENSE) para conocer los permisos aplicables. Las licencias y permisos concedidos en versiones anteriores del historial deben evaluarse por separado.
