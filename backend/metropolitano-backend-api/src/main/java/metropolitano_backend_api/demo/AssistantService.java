package metropolitano_backend_api.demo;

import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.Part;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Profile("demo")
public class AssistantService {
    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);
    static final String INSTRUCTIONS = """
        Eres el asistente de la aplicacion del Metropolitano. Responde en español, de forma natural, clara y breve.
        Responde directamente a la pregunta, sin presentarte ni repetir que eres un prototipo en cada respuesta.
        No afirmes que la aplicacion sea un servicio oficial de ATU; si te preguntan, explica que no lo es.
        Usa solo el contexto de la aplicacion para datos de transporte.
        Los datos de transporte, alertas, recargas y tiempos son simulados y no estan actualizados:
        aclara esto brevemente cuando proporciones esos datos, sin atribuirles caracter oficial.
        No inventes horarios, choques, tarifas, rutas, pagos ni datos en tiempo real; indica si algo no esta disponible.
        Cada consulta es independiente: no puedes recordar mensajes anteriores ni ejecutar acciones o calcular rutas.
        No prometas mostrar tiempos, lineas o paradas despues de que el usuario indique una estacion.
        Para planificar una ruta, explica que debe abrir Rutas, seleccionar origen y destino y pulsar Buscar ruta.
        Los accesos a Inicio, Rutas, Alertas y Cuenta estan en el panel del asistente; el usuario debe pulsarlos.
        No solicites datos personales, credenciales ni datos de pago. No ejecutes operaciones.
        Si se pide ayuda ante una emergencia, recomienda contactar a los servicios de emergencia locales.
        Contexto de la aplicacion:
        """;
    private final DemoService demo;

    public AssistantService(DemoService demo) {
        this.demo = demo;
    }

    public String answer(String accountId, String message) {
        String key = System.getenv("GEMINI_API_KEY");
        if (key == null || key.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "El asistente no esta configurado en el servidor");
        }
        String instructions = INSTRUCTIONS + demo.assistantContext(accountId);
        try (Client client = Client.builder().apiKey(key)
                .httpOptions(HttpOptions.builder().timeout(30000).build()).build()) {
            var config = GenerateContentConfig.builder()
                .systemInstruction(Content.fromParts(Part.fromText(instructions)))
                .maxOutputTokens(1024).build();
            String reply = client.models.generateContent("gemini-3.5-flash-lite", message, config).text();
            if (reply == null || reply.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "El asistente no pudo generar una respuesta");
            }
            return reply;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (ApiException e) {
            log.warn("Gemini rechazo la solicitud con codigo HTTP {}", e.code());
            String detail = switch (e.code()) {
                case 400, 401, 403 -> "Google rechazo la solicitud. Revisa la clave y la configuracion de Gemini en el servidor.";
                case 404 -> "El modelo Gemini no esta disponible para esta cuenta.";
                case 429 -> "Se alcanzo el limite de Gemini. Espera o revisa la cuota de tu cuenta.";
                default -> "El servicio de IA no esta disponible; intenta nuevamente.";
            };
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, detail);
        } catch (RuntimeException e) {
            log.warn("La solicitud al proveedor de IA fallo ({})", e.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "El servicio de IA no esta disponible; intenta nuevamente");
        }
    }
}
