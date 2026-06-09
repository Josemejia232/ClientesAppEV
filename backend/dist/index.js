"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = process.env.PORT || 3004;
(0, app_1.initDb)().then(() => {
    app_1.app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📋 API de clientes disponible en http://localhost:${PORT}/api`);
    });
}).catch((err) => {
    console.error('❌ Error al inicializar la base de datos:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map