// ==========================================
// 1. RELOJ EN TIEMPO REAL
// ==========================================
function actualizarReloj() {
    const ahora = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    const relojElement = document.getElementById('relojRealTime');
    if (relojElement) relojElement.textContent = ahora.toLocaleDateString('es-CO', opciones);
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
});

// ==========================================
// 2. MANEJO DEL INICIO DE SESIÓN Y NAVEGACIÓN
// ==========================================
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const tipoUsuario = document.getElementById('tipoUsuario').value;
    const usuario = document.getElementById('usuario').value.trim();
    const passwordElement = document.getElementById('password');
    const password = passwordElement ? passwordElement.value.trim() : '';
    
    const resultadoContainer = document.getElementById('resultadoContainer');
    const listaResultados = document.getElementById('listaResultados');

    try {
        const response = await fetch('/api/consultar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoUsuario, usuario, password })
        });

        const data = await response.json();
        resultadoContainer.classList.remove('hidden');

        if (data.success) {
            let sidebarMenuHTML = '';
            if (data.menu && data.menu.length > 0) {
                sidebarMenuHTML = `
                    <div style="margin-top: 15px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
                        <p style="font-weight: 700; color: #065f46; margin-bottom: 12px; font-size: 1.1rem;">📂 Menú Interactivo (${data.rol}):</p>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                            ${data.menu.map(item => `
                                <button class="menu-btn" data-accion="${item}" style="background: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1; font-weight: 500; font-size: 0.95rem; display: flex; align-items: center; cursor: pointer; text-align: left; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                    ${item}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div id="vistaDinamica" style="margin-top: 20px; padding: 15px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; display: none;"></div>
                `;
            }

            listaResultados.innerHTML = `
                <div style="padding: 20px; border: 1px solid var(--border-color, #cbd5e1); border-radius: 10px; background: #f8fafc; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;">
                        <div>
                            <p style="margin: 0; font-size: 1.1rem; color: #1e293b;"><strong>Usuario:</strong> ${data.nombre || usuario}</p>
                            <p style="margin: 4px 0 0 0; font-size: 0.95rem; color: #64748b;"><strong>Rol Activo:</strong> ${data.rol}</p>
                        </div>
                        <div>
                            <span style="background: #22c55e; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem;">ACTIVO</span>
                        </div>
                    </div>
                    ${sidebarMenuHTML}
                </div>
            `;

            // Escuchadores del menú interactivo
            document.querySelectorAll('.menu-btn').forEach(boton => {
                boton.addEventListener('click', async () => {
                    const accion = boton.getAttribute('data-accion');
                    const vistaDinamica = document.getElementById('vistaDinamica');
                    vistaDinamica.style.display = 'block';

                    // CERRAR SESIÓN
                    if (accion.includes('Cerrar sesión')) {
                        alert('Sesión cerrada correctamente.');
                        location.reload();
                        return;
                    }

                    // 1. GESTIÓN DE USUARIOS
                    if (accion.includes('Usuarios')) {
                        async function renderUsuarios() {
                            const res = await fetch('/api/usuarios');
                            const json = await res.json();
                            vistaDinamica.innerHTML = `
                                <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">👥 ${accion}</h4>
                                <form id="formCrearUsuario" style="margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1;">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                        <input type="text" id="inputUsuario" placeholder="Cuenta (ej: user1)" required style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;">
                                        <input type="text" id="inputNombre" placeholder="Nombre completo" required style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;">
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                        <select id="inputRol" style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;">
                                            <option value="Paciente">Paciente</option>
                                            <option value="Médico">Médico</option>
                                            <option value="Empresa">Empresa</option>
                                            <option value="Sede">Sede</option>
                                            <option value="Panel Administrativo">Admin</option>
                                        </select>
                                        <input type="password" id="inputPass" placeholder="Contraseña" required style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem;">
                                        <button type="submit" style="background: #047857; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">+ Agregar</button>
                                    </div>
                                </form>
                                <div style="overflow-x: auto;">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                        <thead>
                                            <tr style="background: #f1f5f9; text-align: left;">
                                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Cuenta</th>
                                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Nombre</th>
                                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Rol</th>
                                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Estado</th>
                                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${json.usuarios.map(u => `
                                                <tr>
                                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${u.usuario}</td>
                                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${u.nombre}</td>
                                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${u.rol}</td>
                                                    <td style="padding: 8px; border: 1px solid #cbd5e1; color: #047857; font-weight: bold;">${u.estado}</td>
                                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">
                                                        <button class="btn-eliminar-user" data-id="${u.id}" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Eliminar</button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `;

                            document.getElementById('formCrearUsuario').addEventListener('submit', async (ev) => {
                                ev.preventDefault();
                                const uBody = {
                                    usuario: document.getElementById('inputUsuario').value.trim(),
                                    nombre: document.getElementById('inputNombre').value.trim(),
                                    rol: document.getElementById('inputRol').value,
                                    password: document.getElementById('inputPass').value.trim()
                                };
                                const resp = await fetch('/api/usuarios', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(uBody)
                                });
                                const rData = await resp.json();
                                if (rData.success) {
                                    renderUsuarios();
                                } else {
                                    alert(rData.mensaje);
                                }
                            });

                            document.querySelectorAll('.btn-eliminar-user').forEach(btn => {
                                btn.addEventListener('click', async () => {
                                    const id = btn.getAttribute('data-id');
                                    if (confirm('¿Desea eliminar este usuario del sistema?')) {
                                        await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
                                        renderUsuarios();
                                    }
                                });
                            });
                        }
                        renderUsuarios();
                        return;
                    }

                    // 2. ROLES Y PERMISOS
                    if (accion.includes('Roles y permisos')) {
                        vistaDinamica.innerHTML = `
                            <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">🔒 ${accion}</h4>
                            <p style="font-size: 0.9rem; color: #475569; margin-bottom: 12px;">Configuración de privilegios y accesos asignados por rol corporativo:</p>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                    <thead>
                                        <tr style="background: #f1f5f9; text-align: left;">
                                            <th style="padding: 8px; border: 1px solid #cbd5e1;">Rol del Sistema</th>
                                            <th style="padding: 8px; border: 1px solid #cbd5e1;">Nivel de Acceso</th>
                                            <th style="padding: 8px; border: 1px solid #cbd5e1;">Módulos Permitidos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Panel Administrativo</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #047857;">Total / Global</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Usuarios, Sedes, Subir PDF, Reportes, Auditoría, Configuración</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Médico</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #0284c7;">Intermedio</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Citas, Agenda, Resultados, Pacientes</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Empresa / Sede</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #d97706;">Restringido</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Empleados, Resultados Ocupacionales, Sedes</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Paciente</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">Básico / Personal</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Descargar Resultados en PDF, Mis Citas</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <button onclick="alert('Cambios de permisos guardados con éxito.')" style="margin-top: 12px; background: #047857; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">💾 Guardar Cambios de Permisos</button>
                        `;
                        return;
                    }

                    // 3. CONFIGURACIÓN Y SISTEMA
                    if (accion.includes('Configuración y sistema')) {
                        vistaDinamica.innerHTML = `
                            <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">⚙️ ${accion}</h4>
                            <p style="font-size: 0.9rem; color: #475569; margin-bottom: 15px;">Parámetros generales del sistema CEMSA-Resultados y conexión con bases de datos:</p>
                            <div style="display: grid; gap: 12px; font-size: 0.9rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    <span>Modo de Operación del Servidor:</span>
                                    <strong style="color: #047857;">Producción (Cloud Railway)</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    <span>Sincronización Automática de Resultados:</span>
                                    <input type="checkbox" checked style="transform: scale(1.2); cursor: pointer;">
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    <span>Notificaciones por Correo a Pacientes:</span>
                                    <input type="checkbox" checked style="transform: scale(1.2); cursor: pointer;">
                                </div>
                            </div>
                            <button onclick="alert('Parámetros de configuración actualizados correctamente.')" style="margin-top: 15px; background: #047857; color: white; border: none; padding: 9px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">💾 Guardar Configuración</button>
                        `;
                        return;
                    }

                    // 4. SUBIR RESULTADOS EN PDF
                    if (accion.includes('Subir resultados en PDF')) {
                        vistaDinamica.innerHTML = `
                            <h4 style="color: #065f46; margin-top: 0; margin-bottom: 15px;">📤 ${accion}</h4>
                            <form id="formSubidaPdf" style="display: grid; gap: 12px;">
                                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Tipo Doc:</label>
                                        <select id="tipoDocSubida" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                            <option value="AS">AS - Adulto Sin Identificación</option>
                                            <option value="CC" selected>CC - Cédula de Ciudadanía</option>
                                            <option value="CD">CD - Carné Diplomático</option>
                                            <option value="CE">CE - Cédula de Extranjería</option>
                                            <option value="CN">CN - Certificado de Nacido Vivo</option>
                                            <option value="MS">MS - Menor Sin Identificación</option>
                                            <option value="NI">NI - Número de Identificación Tributaria</option>
                                            <option value="NU">NU - Número Único de Identificación Personal</option>
                                            <option value="PA">PA - Pasaporte</option>
                                            <option value="PD">PD - Pasaporte Diplomático</option>
                                            <option value="PE">PE - Permiso Especial de Permanencia</option>
                                            <option value="PT">PT - Permiso por Protección Temporal</option>
                                            <option value="RC">RC - Registro Civil de Nacimiento</option>
                                            <option value="SC">SC - Salvoconducto</option>
                                            <option value="TI">TI - Tarjeta de Identidad</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Número Doc:</label>
                                        <input type="text" id="numDocSubida" placeholder="Ej: 1123456789" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                </div>
                                <div>
                                    <label style="font-size: 0.85rem; font-weight: 600;">Nombre del Paciente:</label>
                                    <input type="text" id="nombrePacSubida" placeholder="Ej: María Pérez" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Fecha:</label>
                                        <input type="date" id="fechaExamenSubida" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Estado:</label>
                                        <select id="estadoExamenSubida" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                            <option value="disponible">🟢 Disponible</option>
                                            <option value="en proceso">🔵 En Proceso</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Archivo PDF:</label>
                                        <input type="file" id="archivoPdfSubida" accept=".pdf" required style="width: 100%; padding: 4px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;">
                                    </div>
                                </div>
                                <button type="submit" style="background: #047857; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">Cargar y Publicar</button>
                            </form>
                            <div id="mensajeSubida" style="margin-top: 10px; font-weight: 600;"></div>
                        `;

                        document.getElementById('formSubidaPdf').addEventListener('submit', async (ev) => {
                            ev.preventDefault();
                            const resp = await fetch('/api/subir-resultado', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    tipoDoc: document.getElementById('tipoDocSubida').value,
                                    numeroDoc: document.getElementById('numDocSubida').value,
                                    nombrePaciente: document.getElementById('nombrePacSubida').value,
                                    fechaExamen: document.getElementById('fechaExamenSubida').value,
                                    estadoExamen: document.getElementById('estadoExamenSubida').value,
                                    nombreArchivo: document.getElementById('archivoPdfSubida').files[0]?.name || 'reporte.pdf'
                                })
                            });
                            const rData = await resp.json();
                            const msg = document.getElementById('mensajeSubida');
                            msg.style.color = '#047857';
                            msg.textContent = rData.mensaje;
                        });
                        return;
                    }

                    // 5. INICIO (Rol Paciente / Rol Administrativo)
                    if (accion.includes('Inicio')) {
                        vistaDinamica.innerHTML = `
                            <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">🏠 ${accion}</h4>
                            <p style="font-size: 0.95rem; color: #334155; line-height: 1.5;">Bienvenido al sistema institucional <strong>CEMSA-Resultados</strong>. Desde este panel principal podrá gestionar de forma ágil y segura todas las operaciones correspondientes a su perfil activo.</p>
                            <div style="margin-top: 15px; background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                <p style="margin: 0; font-size: 0.9rem; color: #475569;">Seleccione una opción del menú interactivo superior para desplegar los módulos disponibles.</p>
                            </div>
                        `;
                        return;
                    }

                    // 6. MI PERFIL (Rol Paciente)
                    if (accion.includes('Mi perfil') || accion.includes('Actualizar sus datos')) {
                        vistaDinamica.innerHTML = `
                            <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">👤 Mi perfil: Actualizar sus datos</h4>
                            <form id="formActualizarPerfil" style="display: grid; gap: 12px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Nombre Completo:</label>
                                        <input type="text" id="perfilNombre" value="${data.nombre || ''}" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Correo Electrónico:</label>
                                        <input type="email" id="perfilCorreo" placeholder="correo@ejemplo.com" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Teléfono de Contacto:</label>
                                        <input type="text" id="perfilTelefono" placeholder="Ej: 3001234567" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                    <div>
                                        <label style="font-size: 0.85rem; font-weight: 600;">Nueva Contraseña:</label>
                                        <input type="password" id="perfilPassword" placeholder="Dejar en blanco para mantener" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
                                    </div>
                                </div>
                                <button type="submit" style="background: #047857; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">💾 Guardar Cambios de Perfil</button>
                            </form>
                            <div id="mensajePerfil" style="margin-top: 10px; font-weight: 600;"></div>
                        `;

                        document.getElementById('formActualizarPerfil').addEventListener('submit', (ev) => {
                            ev.preventDefault();
                            const msgPerfil = document.getElementById('mensajePerfil');
                            msgPerfil.style.color = '#047857';
                            msgPerfil.textContent = 'Datos de perfil actualizados exitosamente.';
                        });
                        return;
                    }

                    // 7. NOTIFICACIONES (Rol Paciente)
                    if (accion.includes('Notificaciones')) {
                        vistaDinamica.innerHTML = `
                            <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">🔔 ${accion}</h4>
                            <p style="font-size: 0.9rem; color: #475569; margin-bottom: 12px;">Historial de avisos y alertas recientes en la plataforma:</p>
                            <div style="display: grid; gap: 8px;">
                                <div style="background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;">
                                    <strong style="color: #047857;">Resultado Disponible:</strong> Su examen médico de laboratorio ya se encuentra cargado y listo para descarga. <span style="font-size: 0.75rem; color: #64748b; float: right;">2026-07-26</span>
                                </div>
                                <div style="background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;">
                                    <strong style="color: #0284c7;">Cita Programada:</strong> Recuerde asistir a su cita con medicina general el próximo 2026-07-30. <span style="font-size: 0.75rem; color: #64748b; float: right;">2026-07-25</span>
                                </div>
                            </div>
                        `;
                        return;
                    }

                    // 8. MÉDICOS (Rol Administrativo)
                    if (accion.includes('Médicos')) {
                        vistaDinamica.innerHTML = `
                            <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">👨‍⚕️ Directorio de ${accion}</h4>
                            <p style="font-size: 0.9rem; color: #475569; margin-bottom: 12px;">Listado de profesionales de la salud vinculados a la red médica:</p>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                    <thead>
                                        <tr style="background: #f1f5f9; text-align: left;">
                                            <th style="padding: 8px; border: 1px solid #cbd5e1;">Médico</th>
                                            <th style="padding: 8px; border: 1px solid #cbd5e1;">Especialidad</th>
                                            <th style="padding: 8px; border: 1px solid #cbd5e1;">Registro Médico</th>
                                            <th style="padding: 8px; border: 1px solid #cbd5e1;">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Dr. Carlos Mendoza</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Medicina General / Ocupacional</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">RM-45892</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #047857; font-weight: bold;">Activo</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Dra. Elena Gómez</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">Laboratorio Clínico / Patología</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1;">RM-98213</td>
                                            <td style="padding: 8px; border: 1px solid #cbd5e1; color: #047857; font-weight: bold;">Activo</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        `;
                        return;
                    }

                    // Vista genérica / por defecto para otras opciones del menú
                    vistaDinamica.innerHTML = `
                        <h4 style="color: #065f46; margin-top: 0; margin-bottom: 12px;">📂 ${accion}</h4>
                        <p style="font-size: 0.95rem; color: #334155;">Módulo correspondiente a <strong>${accion}</strong> cargado correctamente.</p>
                        <div style="margin-top: 10px; padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
                            <p style="margin: 0; font-size: 0.9rem; color: #64748b;">Información y herramientas de gestión disponibles para este panel.</p>
                        </div>
                    `;
                });
            });

        } else {
            listaResultados.innerHTML = `
                <div style="padding: 15px; border: 1px solid #fca5a5; background: #fef2f2; border-radius: 8px; color: #991b1b; font-weight: 500;">
                    ❌ ${data.mensaje || 'Error al iniciar sesión. Verifique sus credenciales.'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al consultar:', error);
        resultadoContainer.classList.remove('hidden');
        listaResultados.innerHTML = `
            <div style="padding: 15px; border: 1px solid #fca5a5; background: #fef2f2; border-radius: 8px; color: #991b1b; font-weight: 500;">
                🚨 Error de conexión con el servidor. Por favor, intente de nuevo más tarde.
            </div>
        `;
    }
});