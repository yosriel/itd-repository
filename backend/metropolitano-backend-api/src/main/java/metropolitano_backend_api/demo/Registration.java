package metropolitano_backend_api.demo;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class Registration {
    private static final Set<String> DOMAINS = Set.of(
        "gmail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com",
        "yahoo.es", "icloud.com", "me.com", "proton.me", "protonmail.com", "aol.com",
        "gmx.com", "zoho.com", "fastmail.com");
    private static final Pattern NAME = Pattern.compile("[\\p{L}\\p{M}]+(?:[ '\\u2019-][\\p{L}\\p{M}]+)*");

    private Registration() {}

    static String normalizedName(String firstName, String lastName, String fullName) {
        if (firstName == null && lastName == null && fullName != null) {
            String[] legacy = cleanName(fullName).split(" ", 2);
            firstName = legacy[0];
            lastName = legacy.length == 2 ? legacy[1] : "";
        }
        String first = cleanName(firstName);
        String last = cleanName(lastName);
        if (!NAME.matcher(first).matches() || !NAME.matcher(last).matches()
                || first.length() + last.length() > 99) {
            throw invalid("Ingresa nombres y apellidos válidos (hasta 100 caracteres en total)");
        }
        return first + " " + last;
    }

    private static String cleanName(String value) {
        return value == null ? "" : java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFC)
            .replaceAll("(?U)\\s+", " ").strip();
    }

    static String normalizedEmail(String value) {
        String email = value.strip().toLowerCase(Locale.ROOT);
        int separator = email.lastIndexOf('@');
        if (separator < 1 || !DOMAINS.contains(email.substring(separator + 1))
                || !email.matches("[a-z0-9_+%.-]+@[a-z0-9.-]+")
                || email.startsWith(".") || email.substring(0, separator).endsWith(".")
                || email.substring(0, separator).contains("..") || separator > 64) {
            throw invalid("Utiliza un correo válido de Gmail, Outlook u otro proveedor admitido");
        }
        return email;
    }

    static void validatePassword(String password) {
        if (password.codePoints().noneMatch(Character::isUpperCase)
                || password.codePoints().noneMatch(c -> "@#.".indexOf(c) >= 0)) {
            throw invalid("Usa al menos una mayúscula y un carácter @, # o . en tu contraseña");
        }
    }

    private static ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
