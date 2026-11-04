# Contribuir

Gracias por ayudar a mejorar Enseñar C.

## Antes de empezar

- Abre un issue para describir un error, una lección incompleta o una mejora amplia.
- Para cambios pequeños, puedes abrir directamente un pull request.
- Mantén las lecciones en español claro, progresivas y con ejemplos C que compilen con un compilador estándar siempre que sea posible.

## Cambios

- No añadas secretos, credenciales, bases de usuarios ni archivos de `.private/`.
- Conserva la interfaz accesible con teclado, etiquetas claras y el diseño blanco y negro.
- No agregues dependencias sin una razón concreta; el proyecto usa Node.js integrado.
- Describe en el pull request qué cambió y cómo lo verificaste.

## Verificación

```sh
node --check server.js
node --check auth.js
node --check app.js
npm test
```

Al aceptar contribuciones, se publicarán bajo Apache License 2.0.
