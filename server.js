const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Asegúrate de tener instalado 'axios' (npm i axios)

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de clave secreta de reCAPTCHA (puedes usar una variable de entorno)
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || 'TU_CLAVE_SECRETA_DE_GOOGLE';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// BASES DE DATOS SIMULADAS EN MEMORIA
// ==========================================

let usuariosDB = [
    { id: 1, usuario: 'admin', password: '123', nombre: 'Administrador General', rol: 'Panel Administrativo', estado: 'Activo' },
    { id: 2, usuario: 'medico1', password: '123', nombre: 'Dr. Carlos Mendoza', rol: 'Médico', estado: 'Activo' },
    { id: 3, usuario: 'empresa1', password: '123', nombre: 'Constructora del Norte', rol: 'Empresa', estado: 'Activo' },
    { id: 4, usuario: 'sede1', password: '123', nombre: 'Sede Principal Fonseca', rol: 'Sede', estado: 'Activo' },
    { id: 5, usuario: 'paciente1', password: '123', nombre: 'María Pérez', rol: 'Paciente', estado: 'Activo' }
];

let resultadosDB = [
    { id: 1, tipoDoc: 'CC', numeroDoc: '1123456789', pacienteDoc: 'CC 1.123.456.789 - María Pérez', fecha: '2026-07-24', estado: 'disponible', archivo: 'resultado_maria_perez.pdf' },
    { id: 2, tipoDoc: 'CC', numeroDoc: '84123456', pacienteDoc: 'CC 84.123.456 - Carlos Mendoza', fecha: '2026-07-25', estado: 'en proceso', archivo: 'resultado_carlos.pdf' }
];

// ==========================================
// RUTAS DE LA API (ENDPOINTS)
// ==========================================

// 1. Endpoint de Autenticación con Validación Estricta y reCAPTCHA
app.post('/api/consultar', async (req, res) => {
    const { tipoUsuario, usuario, password, captchaToken } = req.body;

    // A. Validar que los campos obligatorios no estén vacíos
    if (!usuario || !password) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'El usuario/documento y la contraseña son obligatorios.' 
        });
    }

    // B. Validación del Captcha si el token es enviado desde el cliente
    if (captchaToken) {
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
            return res.status(500).json({ 
                success: false, 
                mensaje: 'Error en el servidor al validar la verificación de seguridad.' 
            });
        }
    }

    // C. Buscar usuario exacto en la base de datos
    const usuarioEncontrado = usuariosDB.find(u => 
        u.usuario.toLowerCase() === usuario.toLowerCase()
    );

    // D. Validar credenciales (Usuario debe existir y la contraseña coincidir)
    if (!usuarioEncontrado || usuarioEncontrado.password !== password) {
        return res.status(401).json({ 
            success: false, 
            mensaje: 'Credenciales inválidas. Usuario o contraseña incorrectos.' 
        });
    }

    // E. Generar menú de navegación según el rol
    let menu = [];
    let rolActivo = usuarioEncontrado.rol;

    switch (rolActivo) {
        case 'Panel Administrativo':
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

    // F. Filtrar los exámenes disponibles si el usuario es Paciente
    let resultadosFiltrados = resultadosDB;
    if (rolActivo === 'Paciente') {
        resultadosFiltrados = resultadosDB.filter(r => 
            r.pacienteDoc.toLowerCase().includes(usuario.toLowerCase())
        );
    }

    // G. Responder con la información del usuario autenticado
    res.json({
        success: true,
        nombre: usuarioEncontrado.nombre,
        rol: rolActivo,
        menu: menu,
        resultados: resultadosFiltrados
    });
});

// 2. Obtener lista de usuarios registrados (Solo Admin)
app.get('/api/usuarios', (req, res) => {
    res.json({ success: true, usuarios: usuariosDB });
});

// 3. Crear nuevo usuario (Solo Admin)
app.post('/api/usuarios', (req, res) => {
    const { usuario, nombre, rol, password } = req.body;
    
    if (!usuario || !nombre || !rol || !password) {
        return res.status(400).json({ 
            success: false, 
            mensaje: 'Todos los campos (usuario, nombre, rol, contraseña) son obligatorios.' 
        });
    }

    const nuevoId = usuariosDB.length > 0 ? usuariosDB[usuariosDB.length - 1].id + 1 : 1;
    const nuevoUsuario = { id: nuevoId, usuario, password, nombre, rol, estado: 'Activo' };
    
    usuariosDB.push(nuevoUsuario);

    res.json({ 
        success: true, 
        mensaje: 'Usuario creado exitosamente', 
        usuario: nuevoUsuario 
    });
});

// 4. Eliminar un usuario por ID (Solo Admin)
app.delete('/api/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
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

    res.json({
        success: true,
        mensaje: `¡Resultado para ${nombrePaciente} cargado y publicado correctamente en el sistema CEMSA!`
    });
});

// Ruta comodín para soportar navegaciones en Single Page Application (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor Node.js
app.listen(PORT, () => {
    console.log(`Servidor CEMSA-Resultados ejecutándose correctamente en el puerto ${PORT}`);
});