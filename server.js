require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Instalación: npm i axios

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de clave secreta de reCAPTCHA
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6LfJ1GctAAAAALZ2-Uj9vpfRcmCYRVrAO93OAzol';

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos del frontend ('public')
app.use(express.static(path.join(__dirname, 'public')));

// Servir archivos cargados (PDFs de resultados) desde 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// BASES DE DATOS SIMULADAS EN MEMORIA
// ==========================================
let usuariosDB = [
    { id: 1, usuario: 'admin1', password: '1234', nombre: 'Administrador General', rol: 'Administrativo', estado: 'Activo', documento: '100100100', tipo_doc: 'CC' },
    { id: 2, usuario: 'medico1', password: '1234', nombre: 'Dr. Carlos Mendoza', rol: 'Médico', estado: 'Activo', documento: '200300400', tipo_doc: 'CC' },
    { id: 3, usuario: 'empresa1', password: '1234', nombre: 'Constructora del Norte', rol: 'Empresa', estado: 'Activo', documento: '900800700', tipo_doc: 'NIT' },
    { id: 4, usuario: 'sede1', password: '1234', nombre: 'Sede Principal Fonseca', rol: 'Sede', estado: 'Activo', documento: '800700600', tipo_doc: 'NIT' },
    { id: 5, usuario: 'paciente1', password: '1234', nombre: 'María Pérez', rol: 'Paciente', estado: 'Activo', documento: '100200300', tipo_doc: 'CC' }
];

let resultadosDB = [
    { id: 1, tipoDoc: 'CC', numeroDoc: '1123456789', pacienteDoc: 'CC 1.123.456.789 - María Pérez', fecha: '2026-07-24', estado: 'disponible', archivo: 'resultado_maria_perez.pdf' },
    { id: 2, tipoDoc: 'CC', numeroDoc: '84123456', pacienteDoc: 'CC 84.123.456 - Carlos Mendoza', fecha: '2026-07-25', estado: 'en proceso', archivo: 'resultado_carlos.pdf' }
];

// ==========================================
// RUTAS DE LA API (ENDPOINTS)
// ==========================================

// Healthcheck para plataformas de despliegue (Railway, Render, etc.)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        mensaje: 'Servidor CEMSA en ejecución',
        timestamp: new Date().toISOString()
    });
});

// Endpoint de Hora Real Institucional (Colombia)
app.get('/api/hora-actual', (req, res) => {
    const ahora = new Date();
    const fechaHoraFormateada = ahora.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'full',
        timeStyle: 'medium'
    });

    res.json({
        success: true,
        iso: ahora.toISOString(),
        formateada: fechaHoraFormateada,
        timestamp: ahora.getTime()
    });
});

// 1. Endpoint de Autenticación con Validación y reCAPTCHA
app.post('/api/consultar', async (req, res, next) => {
    try {
        const { usuario, password, captchaToken } = req.body;

        // A. Validar campos obligatorios
        if (!usuario || !password) {
            return res.status(400).json({ 
                success: false, 
                mensaje: 'El usuario/documento y la contraseña son obligatorios.' 
            });
        }

        // B. Validación de reCAPTCHA (Opcional si viene vacío en entornos locales de prueba)
        if (captchaToken && captchaToken !== 'bypass_local') {
            try {
                const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
                const googleRes = await axios.post(verifyUrl);

                if (!googleRes.data.success) {
                    return res.status(401).json({ 
                        success: false, 
                        mensaje: 'Verificación de Captcha fallida. Intenta nuevamente.' 
                    });
                }
            } catch (error) {
                console.error('Error al validar reCAPTCHA:', error.message);
            }
        }

        // C. Buscar usuario exacto
        const usuarioEncontrado = usuariosDB.find(u => 
            u.usuario.toLowerCase() === usuario.toLowerCase() || u.documento === usuario
        );

        // D. Validar credenciales
        if (!usuarioEncontrado || usuarioEncontrado.password !== password) {
            return res.status(401).json({ 
                success: false, 
                mensaje: 'Credenciales inválidas. Usuario o contraseña incorrectos.' 
            });
        }

        // E. Generar menú de navegación según el rol institucional
        let menu = [];
        let rolActivo = usuarioEncontrado.rol;

        switch (rolActivo) {
            case 'Administrativo':
                menu = [
                    '🏠 Inicio',
                    '👥 Gestión de Usuarios',
                    '🔒 Roles y permisos',
                    '📤 Subir resultados en PDF',
                    '📄 Descargar resultados en PDF',
                    '👨‍⚕️ Médicos',
                    '⚙️ Configuración y sistema',
                    '🚪 Cerrar sesión'
                ];
                break;

            case 'Médico':
                menu = [
                    '🏠 Inicio',
                    '📅 Citas y Agenda',
                    '📄 Resultados de Pacientes',
                    '👤 Mi perfil',
                    '🚪 Cerrar sesión'
                ];
                break;

            case 'Empresa':
            case 'Sede':
                menu = [
                    '🏠 Inicio',
                    '🏢 Red de Sedes y Empresas',
                    '📄 Resultados Ocupacionales',
                    '🚪 Cerrar sesión'
                ];
                break;

            case 'Paciente':
            default:
                menu = [
                    '🏠 Inicio',
                    '📄 Descargar resultados en PDF',
                    '👤 Mi perfil: Actualizar sus datos',
                    '🔔 Notificaciones',
                    '🚪 Cerrar sesión'
                ];
                break;
        }

        // F. Filtrar exámenes si el usuario es Paciente
        let resultadosFiltrados = resultadosDB;
        if (rolActivo === 'Paciente') {
            resultadosFiltrados = resultadosDB.filter(r => 
                r.pacienteDoc.toLowerCase().includes(usuarioEncontrado.nombre.toLowerCase()) ||
                r.numeroDoc === usuarioEncontrado.documento
            );
        }

        // G. Respuesta exitosa
        return res.json({
            success: true,
            nombre: usuarioEncontrado.nombre,
            rol: rolActivo,
            documento: usuarioEncontrado.documento || 'N/A',
            tipo_doc: usuarioEncontrado.tipo_doc || 'CC',
            menu: menu,
            resultados: resultadosFiltrados
        });

    } catch (err) {
        next(err);
    }
});

// 2. Obtener lista de usuarios registrados
app.get('/api/usuarios', (req, res) => {
    res.json({ success: true, usuarios: usuariosDB });
});

// 3. Crear nuevo usuario
app.post('/api/usuarios', (req, res) => {
    const { usuario, nombre, rol, password, documento, tipo_doc } = req.body;
    
    if (!usuario || !nombre || !rol || !password) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Todos los campos obligatorios deben estar completos.' 
        });
    }

    const usuarioExistente = usuariosDB.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());
    if (usuarioExistente) {
        return res.status(400).json({
            success: false,
            mensaje: 'El nombre de usuario ya se encuentra registrado.'
        });
    }

    const nuevoId = usuariosDB.length > 0 ? usuariosDB[usuariosDB.length - 1].id + 1 : 1;
    const nuevoUsuario = { 
        id: nuevoId, 
        usuario, 
        password, 
        nombre, 
        rol, 
        estado: 'Activo', 
        documento: documento || 'N/A', 
        tipo_doc: tipo_doc || 'CC' 
    };
    
    usuariosDB.push(nuevoUsuario);

    res.status(201).json({ 
        success: true, 
        mensaje: 'Usuario creado exitosamente.', 
        usuario: nuevoUsuario 
    });
});

// 4. Eliminar usuario por ID
app.delete('/api/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const usuarioExiste = usuariosDB.some(u => u.id === id);

    if (!usuarioExiste) {
        return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado.' });
    }

    usuariosDB = usuariosDB.filter(u => u.id !== id);
    res.json({ success: true, mensaje: 'Usuario eliminado correctamente.' });
});

// 5. Cargar un nuevo examen o resultado en PDF
app.post('/api/subir-resultado', (req, res) => {
    const { tipoDoc, numeroDoc, nombrePaciente, fechaExamen, estadoExamen, nombreArchivo } = req.body;

    if (!numeroDoc || !nombrePaciente) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Faltan datos del paciente para realizar el registro del examen.' 
        });
    }

    const nuevoId = resultadosDB.length > 0 ? resultadosDB[resultadosDB.length - 1].id + 1 : 1;
    const nuevoResultado = {
        id: nuevoId,
        tipoDoc: tipoDoc || 'CC',
        numeroDoc: numeroDoc,
        pacienteDoc: `${tipoDoc || 'CC'} ${numeroDoc} - ${nombrePaciente}`,
        fecha: fechaExamen || new Date().toISOString().split('T')[0],
        estado: estadoExamen || 'disponible',
        archivo: nombreArchivo || 'reporte.pdf'
    };

    resultadosDB.push(nuevoResultado);

    res.status(201).json({
        success: true,
        mensaje: `¡Resultado para ${nombrePaciente} cargado y publicado correctamente en el sistema CEMSA!`
    });
});

// ==========================================
// MANEJO DE RUTAS Y ERRORES
// ==========================================

// Redirección SPA (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware Global para Errores
app.use((err, req, res, next) => {
    console.error('❌ Error interno:', err.stack || err.message);
    res.status(500).json({
        success: false,
        mensaje: 'Ocurrió un error inesperado en el servidor.'
    });
});

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Servidor CEMSA-Resultados activo en puerto ${PORT}`);
    console.log(`📂 Servidor de archivos 'public' y 'uploads' listo`);
    console.log(`===============================================`);
});