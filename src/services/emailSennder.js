import nodemailer from 'nodemailer';


export async function enviarCorreoRecuperacion(email, token) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pemexmetro580@gmail.com',
      pass: 'ircg oshw szrm iybj'
    }
  });

  // Si se pasa la contraseña, enviar correo con la contraseña en texto plano
  if (arguments.length >= 4) {
    const password = arguments[2];
    const nombre = arguments[3];
    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; background: #f7f7f7; padding: 24px; border-radius: 8px; max-width: 480px; margin: auto;">
        <h2 style="color: #006341;">Recuperación de contraseña</h2>
        <p>Hola <b>${nombre}</b>, tu contraseña actual es:</p>
        <div style="background:#eee; padding:12px; border-radius:6px; font-size:18px; margin:16px 0; color:#d0021b; font-weight:bold;">${password}</div>
        <p>Por seguridad, te recomendamos cambiarla después de iniciar sesión.</p>
        <p>Si no solicitaste este correo, puedes ignorarlo.</p>
      </div>
    `;
    const mailOptions = {
      from: 'pemexmetro580@gmail.com',
      to: email,
      subject: 'Tu contraseña actual',
      html
    };
    let info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado: ' + info.response);
    return true;
  }

  // ...existing código para el flujo normal de recuperación con token...
  let cleanToken = token;
  if (typeof cleanToken === 'string') {
    cleanToken = cleanToken.split('#')[0].split('&')[0];
  }
  const electronLink = `scitm://reset-password?token=${cleanToken}`;
  const webLink = `http://localhost:3000/#/reset-password?token=${cleanToken}`;
  const instrucciones = `
    <p><b>Si tienes la app instalada, haz clic en el botón rojo para abrirla directamente.<br>
    Si prefieres usar la versión web, usa el enlace azul.</b></p>
  `;
  const resetLinkHtml = `
    <div style="font-family: Arial, sans-serif; color: #222; background: #f7f7f7; padding: 24px; border-radius: 8px; max-width: 480px; margin: auto;">
      <h2 style="color: #006341;">Recuperación de contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña. Elige una opción:</p>
      <a href="${electronLink}" style="display: inline-block; padding: 12px 24px; background: #d0021b; color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">Abrir en la app</a>
      <br><br>
      <a href="${webLink}" style="display: inline-block; padding: 12px 24px; background: #006341; color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">Abrir en la web</a>
      ${instrucciones}
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <p style="font-size: 13px; color: #888;">Este enlace caduca en 15 minutos.</p>
    </div>
  `;

  const mailOptions = {
    from: 'pemexmetro580@gmail.com',
    to: email,
    subject: 'Recuperación de contraseña',
    html: resetLinkHtml
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    // Mejor manejo: retorna false en vez de lanzar excepción, para que el frontend pueda mostrar mensaje claro
    return false;
  }
}
