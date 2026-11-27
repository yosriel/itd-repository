package metropolitano_backend_api.demo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TransitDestinationsTests {
    @Test
    void returnsVerifiedAdviceBeforeAnyExternalCall() {
        var assistant = new AssistantService(null);
        String reply = assistant.answer("cuenta-prueba", "Quiero irme a las malvinas");
        assertTrue(reply.contains("avenida Argentina"));
        assertTrue(reply.contains("Dos de Mayo"));
        assertTrue(reply.contains("Buscar ruta"));
    }

    @Test
    void recognizesAlternatePhrasesAccentsAndStationNames() {
        assertGuide("¿Cómo llego al Terminal Terrestre Plaza Norte?", "Tomás Valle");
        assertGuide("¿Qué estación me deja cerca de Plaza 2 de Mayo?", "Dos de Mayo");
        assertGuide("Quiero ir de Naranjal hasta la Estación Central", "Estación Central");
        assertGuide("Dónde me bajo para ir al puente de los SUSPIROS", "Bulevar");
        assertGuide("Llévame al Parque Kennedy en Lima", "Ricardo Palma");
        assertGuide("¿Cómo llego a la estación Chimpu Ocllo?", "Chimpu Ocllo");
        assertGuide("Terminal Matellini", "Matellini");
    }

    @Test
    void leavesNonDestinationsAndUnverifiedPlacesToTheAssistant() {
        assertTrue(TransitDestinations.answer("¿Cómo consulto mi saldo?").isEmpty());
        assertTrue(TransitDestinations.answer("Quiero ir a las Malvinas argentinas").isEmpty());
        assertTrue(TransitDestinations.answer("Llévame al aeropuerto").isEmpty());
    }

    @Test
    void describesAllFourRegularServices() {
        assertTrue(TransitDestinations.answer("¿Qué paradas tiene la Ruta A?").orElseThrow().contains("Tacna"));
        assertTrue(TransitDestinations.answer("Regular B").orElseThrow().contains("Chimpu Ocllo"));
        assertTrue(TransitDestinations.answer("Ruta C del Metropolitano").orElseThrow().contains("Matellini"));
        assertTrue(TransitDestinations.answer("Servicio regular D").orElseThrow().contains("Quilca"));
    }

    private static void assertGuide(String question, String station) {
        String guide = TransitDestinations.answer(question).orElseThrow();
        assertTrue(guide.contains(station));
        assertTrue(guide.contains("Buscar ruta"));
    }
}
