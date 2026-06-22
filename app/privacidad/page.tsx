export const metadata = {
  title: "Política de Privacidad — MathApp",
  description:
    "Cómo MathApp recopila, usa y protege la información de las personas que usan la aplicación.",
};

const c = {
  navy: "#0a0a1f",
  surface: "#1a1a38",
  border: "rgba(255,255,255,0.10)",
  gold: "#FFD700",
  text: "#f2f2f7",
  textSoft: "#b9b9c9",
  textMute: "#8585a0",
};

function Num({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 13,
        color: c.navy,
        background: c.gold,
        width: 26,
        height: 26,
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

const h2Style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  margin: "38px 0 14px",
  color: c.gold,
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const h3Style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: "22px 0 8px",
  color: c.text,
};

const pStyle: React.CSSProperties = {
  marginBottom: 14,
  color: c.textSoft,
  fontSize: 15,
};

const liStyle: React.CSSProperties = {
  color: c.textSoft,
  fontSize: 15,
  marginBottom: 9,
};

const strong: React.CSSProperties = { color: c.text, fontWeight: 700 };
const linkStyle: React.CSSProperties = {
  color: c.gold,
  textDecoration: "none",
  borderBottom: "1px solid rgba(255,215,0,0.35)",
};

export default function PrivacidadPage() {
  return (
    <div style={{ background: c.navy, minHeight: "100vh", padding: "0 20px" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "56px 0 80px",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
          lineHeight: 1.7,
          color: c.text,
        }}
      >
        {/* Header */}
        <header
          style={{
            textAlign: "center",
            paddingBottom: 32,
            borderBottom: `1px solid ${c.border}`,
            marginBottom: 40,
          }}
        >
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 14 }}>
            🧮
          </div>

          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              marginBottom: 8,
            }}
          >
            Política de Privacidad
          </h1>

          <p
            style={{
              fontSize: 13,
              color: c.textMute,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            MathApp · Última actualización: 16 de junio de 2026
          </p>
        </header>

        {/* Intro */}
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: "22px 24px",
            marginBottom: 36,
            color: c.textSoft,
            fontSize: 15,
          }}
        >
          Esta Política de Privacidad describe cómo MathApp
          (&quot;nosotros&quot;, &quot;la aplicación&quot;) recopila, usa y
          protege la información de las personas que usan nuestra aplicación
          educativa de matemática. Al usar MathApp, aceptás las prácticas
          descritas en este documento.
        </div>

        {/* 1 */}
        <h2 style={h2Style}>
          <Num>1</Num> Quiénes somos
        </h2>
        <p style={pStyle}>
          MathApp es una aplicación educativa de matemática gamificada, pensada
          para que estudiantes de todas las edades, desde nivel primario hasta
          universitario, practiquen y aprendan jugando. La aplicación está
          disponible para dispositivos Android a través de Google Play.
        </p>
        <p style={pStyle}>
          El responsable del tratamiento de los datos es el equipo de MathApp,
          con operación orientada a usuarios de Latinoamérica.
        </p>

        {/* 2 */}
        <h2 style={h2Style}>
          <Num>2</Num> Qué información recopilamos
        </h2>
        <p style={pStyle}>
          Para que la aplicación funcione, recopilamos los siguientes datos:
        </p>

        <h3 style={h3Style}>Datos que nos proporcionás al registrarte</h3>
        <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
          <li style={liStyle}>
            <strong style={strong}>Correo electrónico</strong>: para crear y
            acceder a tu cuenta.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Nombre o nombre de usuario</strong>: para
            personalizar tu perfil dentro del juego.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Datos de inicio de sesión con Google</strong>
            : si elegís iniciar sesión con Google, recibimos tu dirección de
            correo electrónico y el identificador básico de tu cuenta de Google.
            No accedemos a tu contraseña de Google.
          </li>
        </ul>

        <h3 style={h3Style}>Datos que se generan al usar la aplicación</h3>
        <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
          <li style={liStyle}>
            <strong style={strong}>Progreso de juego</strong>: niveles
            completados, estrellas, monedas, vidas, racha y etapa actual.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Datos de compras</strong>: registro de las
            compras realizadas dentro de la aplicación (paquetes de monedas y
            suscripción Plan Pro), gestionadas a través de Google Play.
          </li>
        </ul>

        <h3 style={h3Style}>Datos recopilados automáticamente por terceros</h3>
        <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
          <li style={liStyle}>
            Proveedores como Google AdMob pueden recopilar identificadores del
            dispositivo con fines publicitarios, según se describe en la sección
            de publicidad.
          </li>
        </ul>

        {/* 3 */}
        <h2 style={h2Style}>
          <Num>3</Num> Cómo usamos la información
        </h2>
        <p style={pStyle}>Usamos los datos recopilados únicamente para:</p>
        <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
          <li style={liStyle}>
            Crear y administrar tu cuenta y tu perfil de jugador.
          </li>
          <li style={liStyle}>
            Guardar y sincronizar tu progreso entre sesiones y dispositivos.
          </li>
          <li style={liStyle}>
            Procesar compras dentro de la aplicación y activar los beneficios
            correspondientes.
          </li>
          <li style={liStyle}>
            Mostrar publicidad (en la versión gratuita) y otorgar recompensas
            por ver anuncios.
          </li>
          <li style={liStyle}>
            Mejorar la aplicación y resolver problemas técnicos.
          </li>
          <li style={liStyle}>
            Comunicarnos con vos respecto a tu cuenta cuando sea necesario.
          </li>
        </ul>
        <p style={pStyle}>No vendemos tu información personal a terceros.</p>

        {/* 4 */}
        <h2 style={h2Style}>
          <Num>4</Num> Servicios de terceros
        </h2>
        <p style={pStyle}>
          MathApp utiliza servicios de terceros que pueden procesar ciertos
          datos para cumplir sus funciones. Cada uno tiene su propia política de
          privacidad:
        </p>
        <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
          <li style={liStyle}>
            <strong style={strong}>Supabase</strong>: almacenamiento de cuentas,
            perfiles y progreso de juego.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Google Play / Google Sign-In</strong>: inicio
            de sesión, compras y distribución de la app.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Google AdMob</strong>: publicidad dentro de
            la aplicación (versión gratuita).
          </li>
        </ul>
        <p style={pStyle}>
          Te recomendamos revisar las políticas de privacidad de{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Google
          </a>{" "}
          y{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            Supabase
          </a>{" "}
          para conocer cómo tratan los datos.
        </p>

        {/* 5 */}
        <h2 style={h2Style}>
          <Num>5</Num> Publicidad
        </h2>
        <p style={pStyle}>
          La versión gratuita de MathApp muestra anuncios proporcionados por
          Google AdMob, incluyendo banners y anuncios con recompensa (ver un
          video para obtener una vida adicional). AdMob puede utilizar
          identificadores del dispositivo para mostrar anuncios.
        </p>
        <p style={pStyle}>
          Los usuarios con suscripción <strong style={strong}>Plan Pro</strong>{" "}
          no ven publicidad dentro de la aplicación.
        </p>

        {/* 6 */}
        <div
          style={{
            background: "rgba(255,215,0,0.07)",
            border: "1px solid rgba(255,215,0,0.25)",
            borderRadius: 14,
            padding: "20px 22px",
            margin: "24px 0",
          }}
        >
          <h2 style={{ ...h2Style, marginTop: 0 }}>
            <Num>6</Num> Privacidad de los menores
          </h2>
          <p style={pStyle}>
            MathApp es una aplicación educativa que puede ser utilizada por
            niños y niñas de nivel primario. La privacidad de los menores es muy
            importante para nosotros y tomamos medidas para proteger sus datos.
          </p>
          <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
            <li style={liStyle}>
              Recomendamos que el registro y la administración de la cuenta de
              un menor se realice con la participación de un padre, madre o
              tutor responsable.
            </li>
            <li style={liStyle}>
              No solicitamos a los menores más información personal que la
              necesaria para usar la aplicación.
            </li>
            <li style={liStyle}>
              No vendemos ni compartimos datos de menores con fines comerciales
              ajenos al funcionamiento de la app.
            </li>
            <li style={liStyle}>
              La publicidad mostrada está configurada para tratarse de acuerdo
              con las políticas para audiencias infantiles de Google.
            </li>
          </ul>
          <p style={pStyle}>
            Si sos padre, madre o tutor y querés revisar, modificar o eliminar
            la información asociada a la cuenta de un menor, escribinos al
            correo de contacto que figura más abajo y atenderemos tu solicitud.
            MathApp cumple con la Ley de Protección de la Privacidad Infantil en
            Internet (COPPA) de los EE.UU. y con el Reglamento General de
            Protección de Datos (GDPR) de la Unión Europea en lo que respecta al
            tratamiento de datos de menores. No recopilamos intencionalmente
            datos personales de menores de 13 años sin el consentimiento
            verificable de sus padres o tutores. Si tomamos conocimiento de que
            hemos recopilado datos de un menor sin dicho consentimiento, los
            eliminaremos a la brevedad.
          </p>
        </div>

        {/* 7 */}
        <h2 style={h2Style}>
          <Num>7</Num> Cómo protegemos tus datos
        </h2>
        <p style={pStyle}>
          Aplicamos medidas técnicas y organizativas razonables para proteger la
          información, incluyendo el acceso autenticado a las cuentas y reglas
          de seguridad en nuestra base de datos. Sin embargo, ningún sistema es
          completamente infalible, por lo que no podemos garantizar seguridad
          absoluta.
        </p>

        {/* 8 */}
        <h2 style={h2Style}>
          <Num>8</Num> Conservación de los datos
        </h2>
        <p style={pStyle}>
          Conservamos tu información mientras tu cuenta esté activa. Si
          solicitás la eliminación de tu cuenta, eliminaremos tus datos
          personales asociados, salvo aquellos que debamos conservar por
          obligaciones legales o contables (por ejemplo, registros de compras).
        </p>

        {/* 9 */}
        <h2 style={h2Style}>
          <Num>9</Num> Tus derechos
        </h2>
        <p style={pStyle}>
          Podés ejercer en cualquier momento los siguientes derechos sobre tus
          datos:
        </p>
        <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
          <li style={liStyle}>
            <strong style={strong}>Acceso</strong>: solicitar una copia de los
            datos que tenemos sobre vos.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Rectificación</strong>: corregir datos
            inexactos o incompletos.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Eliminación</strong>: solicitar que borremos
            tu cuenta y tus datos personales.
          </li>
          <li style={liStyle}>
            <strong style={strong}>Oposición</strong>: pedir que dejemos de usar
            tus datos para determinados fines.
          </li>
        </ul>
        <p style={pStyle}>
          Para ejercer cualquiera de estos derechos, escribinos al correo de
          contacto. Responderemos en un plazo razonable.
        </p>

        {/* 10 */}
        <h2 style={h2Style}>
          <Num>10</Num> Cambios en esta política
        </h2>
        <p style={pStyle}>
          Podemos actualizar esta Política de Privacidad para reflejar cambios
          en la aplicación o en la normativa aplicable. Cuando lo hagamos,
          actualizaremos la fecha de &quot;última actualización&quot; en la
          parte superior. Te recomendamos revisar esta página periódicamente.
        </p>

        {/* Contacto */}
        {/* Contacto */}
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: 26,
            marginTop: 40,
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: 6, color: c.textSoft, fontSize: 15 }}>
            ¿Tenés preguntas sobre tu privacidad o querés ejercer tus derechos?
          </p>

          <a
            href="mailto:hola@viko.com.ar"
            style={{ ...linkStyle, fontSize: 17, fontWeight: 700 }}
          >
            hola@viko.com.ar
          </a>
        </div>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${c.border}`,
            color: c.textMute,
            fontSize: 13,
          }}
        >
          © 2026 MathApp. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
