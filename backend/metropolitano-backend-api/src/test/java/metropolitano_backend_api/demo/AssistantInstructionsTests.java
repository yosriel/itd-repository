package metropolitano_backend_api.demo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AssistantInstructionsTests {
    @Test
    void describesNavigationAndLimitsWithoutClaimingOfficialData() {
        assertTrue(AssistantService.INSTRUCTIONS.contains("No afirmes que la aplicacion sea un servicio oficial de ATU"));
        assertTrue(AssistantService.INSTRUCTIONS.contains("son simulados"));
        assertTrue(AssistantService.INSTRUCTIONS.contains("seleccionar origen y destino y pulsar Buscar ruta"));
        assertTrue(AssistantService.INSTRUCTIONS.contains("no puedes recordar mensajes anteriores ni ejecutar acciones o calcular rutas"));
    }
}
