package metropolitano_backend_api.demo;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

final class TransitDestinations {
    private static final Pattern TRIP = Pattern.compile(
        "^(?:(?:como )?(?:llego|voy|ir|puedo llegar)|(?:quiero|quisiera|necesito) (?:irme|ir|llegar|viajar)"
            + "|llevame|donde me bajo para ir)(?: de .+?)? (?:a|al|hasta) (.+)$");
    private static final Pattern STATION_FOR = Pattern.compile(
        "^(?:que estacion (?:me deja cerca de|queda cerca de|queda mas cerca de|uso para ir a)"
            + "|en que estacion me bajo para ir a|donde me bajo para|como llegar a) (.+)$");

    private static final Pattern REGULAR = Pattern.compile(
        "^(?:(?:cual es(?: el recorrido de)?|como es|que paradas tiene) (?:el |la )?)?"
            + "(?:ruta (?:regular )?|servicio (?:regular )?|regular )([abcd])(?: del metropolitano)?$");
    private static final Map<String, String> REGULAR_GUIDES = Map.of(
        "a", "La Regular A une Naranjal y Estación Central por Ramón Castilla, Tacna, Jirón de la Unión y Colmena.",
        "b", "La Regular B une Chimpu Ocllo y Estación Central. Incluye Las Vegas, Naranjal, Dos de Mayo, Quilca y España.",
        "c", "La Regular C une Ramón Castilla y Matellini. Pasa por Estación Central, la Vía Expresa y Barranco.",
        "d", "La Regular D une Naranjal y Estación Central por Dos de Mayo, Quilca y España.");
    private static final Map<String, Destination> CATALOG = catalog();

    private record Destination(String station, String detail) {
        String guide() {
            String direction = detail.isEmpty() ? "Tu estación de destino es " + station + "." : detail;
            return direction + "\n\nEn Rutas, confirma tu origen, selecciona " + station
                + " y toca Buscar ruta. Revisa el horario del servicio antes de salir.";
        }
    }

    private TransitDestinations() {}

    static Optional<String> answer(String message) {
        String query = normalize(message).replaceFirst("^(?:hola|por favor) +", "")
            .replaceFirst(" (?:por favor|gracias)$", "")
            .replaceFirst(" (?:en )?(?:el )?(?:cercado de lima|lima peru|lima)$", "");
        var regular = REGULAR.matcher(query);
        if (regular.matches()) {
            return Optional.of(REGULAR_GUIDES.get(regular.group(1))
                + "\n\nEn Rutas, elige la letra del servicio para consultar sus paradas y la ficha de la ATU.");
        }
        var trip = TRIP.matcher(query);
        if (trip.matches()) {
            query = trip.group(1);
        } else {
            var station = STATION_FOR.matcher(query);
            if (station.matches()) {
                query = station.group(1);
            }
        }
        String key = query.replaceFirst("^(?:la |el )", "");
        var destination = CATALOG.get(key);
        if (destination == null) {
            destination = CATALOG.get(key.replaceFirst("^(?:estacion |terminal )", ""));
        }
        return Optional.ofNullable(destination).map(Destination::guide);
    }

    private static String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").strip();
    }

    private static Map<String, Destination> catalog() {
        Map<String, Destination> entries = new HashMap<>();
        for (String station : List.of("Chimpu Ocllo", "Los Incas", "Andrés Belaúnde", "22 de Agosto",
                "Las Vegas", "Universidad", "Naranjal", "Izaguirre", "Pacífico", "Independencia",
                "Los Jazmines", "Tomás Valle", "El Milagro", "Honorio Delgado", "UNI",
                "Parque del Trabajo", "Caquetá", "Ramón Castilla", "Tacna", "Jirón de la Unión",
                "Colmena", "Quilca", "España", "Estadio Nacional", "México", "Canadá",
                "Javier Prado", "Canaval y Moreyra", "Aramburú", "Domingo Orué", "Angamos",
                "Ricardo Palma", "Benavides", "28 de Julio", "Plaza de Flores", "Balta",
                "Bulevar", "Estadio Unión", "Escuela Militar", "Terán", "Rosario de Villa", "Matellini")) {
            register(entries, station, station, "");
        }
        register(entries, "Estación Central", "Estación Central", "", "Central");
        register(entries, "Dos de Mayo", "Dos de Mayo", "", "2 de Mayo", "Plaza Dos de Mayo", "Plaza 2 de Mayo");
        register(entries, "Andrés Belaúnde", "Andrés Belaúnde", "", "Belaúnde");
        register(entries, "Plaza Norte", "Tomás Valle",
            "Para Plaza Norte, baja en Tomás Valle. El centro comercial está junto al cruce de la avenida Tomás Valle y la Panamericana Norte.",
            "Mall Plaza Norte", "Centro Comercial Plaza Norte", "Terminal Terrestre Plaza Norte");
        register(entries, "Parque Alameda Las Malvinas", "Dos de Mayo",
            "Si te refieres a la Alameda Las Malvinas, está en la avenida Argentina, en el Cercado de Lima. "
                + "Dos de Mayo es una referencia cercana. La alameda abarca seis cuadras, así que confirma la cuadra o galería antes de salir.",
            "Las Malvinas", "Alameda Las Malvinas", "Las Malvinas de la avenida Argentina", "Malvinas");
        register(entries, "Parque Kennedy", "Ricardo Palma",
            "Para el Parque Kennedy de Miraflores, baja en Ricardo Palma y continúa a pie por la avenida Ricardo Palma.",
            "Kennedy", "Parque Kennedy de Miraflores");
        register(entries, "Puente de los Suspiros", "Bulevar",
            "Para el Puente de los Suspiros en Barranco, baja en Bulevar y continúa a pie hacia el centro de Barranco.",
            "Puente de los Suspiros en Barranco", "Puente Suspiros");
        register(entries, "Parque Municipal de Barranco", "Bulevar",
            "Para el Parque Municipal de Barranco, usa la estación Bulevar como referencia y continúa a pie hacia la plaza.",
            "Plaza de Barranco", "Parque de Barranco");
        return Map.copyOf(entries);
    }

    private static void register(Map<String, Destination> catalog, String name, String station,
            String detail, String... aliases) {
        var destination = new Destination(station, detail);
        catalog.put(normalize(name), destination);
        for (String alias : aliases) {
            catalog.put(normalize(alias), destination);
        }
    }
}
