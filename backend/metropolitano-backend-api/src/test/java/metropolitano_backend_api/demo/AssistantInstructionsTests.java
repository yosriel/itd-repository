package metropolitano_backend_api.demo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AssistantInstructionsTests {
    @Test
    void describesNavigationAndLimitsWithoutClaimingOfficialData() {
        assertTrue(AssistantService.INSTRUCTIONS.contains("No afirmes que la aplicacion sea un servicio oficial de ATU"));
        assertTrue(AssistantService.INSTRUCTIONS.contains("son simulados"));
        assertTrue(AssistantService.INSTRUCTIONS.contains("seleccionar origen y destino y pulsar Buscar ruta"));
        assertTrue(AssistantService.INSTRUCTIONS.contains("no puedes recordar mensajes anteriores ni ejecutar acciones o calcular rutas"));
    }

    @Test
    void removesCompleteAndIncompleteEmphasisFromEveryTab() {
        for (String tab : new String[]{"Inicio", "Rutas", "Alertas", "IA", "Cuenta"}) {
            assertEquals("Abre " + tab + ".", AssistantService.plainText("Abre **" + tab + "**."));
            assertEquals("Abre " + tab + ".", AssistantService.plainText("Abre **" + tab + "."));
            assertEquals(tab, AssistantService.plainText(tab + "***"));
        }
    }

    @Test
    void keepsStepsAccentsAndRouteSymbolsInPlainText() {
        String raw = "## Cómo empezar\n- **Rutas**\n* _Elige España_\n2. Usa `A*` en Estacion_Central.";
        assertEquals("Cómo empezar\n• Rutas\n• Elige España\n2. Usa A* en Estacion_Central.",
            AssistantService.plainText(raw));
        assertEquals("", AssistantService.plainText("  **  "));
        assertEquals("", AssistantService.plainText(null));
    }
}
