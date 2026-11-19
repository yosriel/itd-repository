package metropolitano_backend_api;

import metropolitano_backend_api.demo.AssistantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:assistant-test;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class AssistantApiTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockitoBean AssistantService assistant;

    private String login() throws Exception {
        var result = mvc.perform(post("/api/v1/demo/sessions/presentation"))
            .andExpect(status().isOk()).andReturn();
        return "Bearer " + mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    @Test void requiresSessionAndValidMessage() throws Exception {
        mvc.perform(post("/api/v1/demo/assistant").contentType("application/json")
            .content("{\"message\":\"Hola\"}")).andExpect(status().isUnauthorized());
        var auth = login();
        for (String message : new String[] { "", "   ", "a".repeat(1001) }) {
            mvc.perform(post("/api/v1/demo/assistant").header("Authorization", auth)
                .contentType("application/json").content(mapper.writeValueAsString(java.util.Map.of("message", message))))
                .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(assistant);
    }

    @Test void returnsAnswerAndSurfacesProviderErrors() throws Exception {
        var auth = login();
        when(assistant.answer(anyString(), eq("Hola"))).thenReturn("Datos simulados");
        mvc.perform(post("/api/v1/demo/assistant").header("Authorization", auth)
            .contentType("application/json").content("{\"message\":\"Hola\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.reply").value("Datos simulados"));
        when(assistant.answer(anyString(), eq("Error"))).thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Servicio no disponible"));
        mvc.perform(post("/api/v1/demo/assistant").header("Authorization", auth)
            .contentType("application/json").content("{\"message\":\"Error\"}"))
            .andExpect(status().isBadGateway()).andExpect(jsonPath("$.detail").value("Servicio no disponible"));
    }
}
