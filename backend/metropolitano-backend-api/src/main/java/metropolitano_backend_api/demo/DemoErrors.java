package metropolitano_backend_api.demo;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestControllerAdvice(assignableTypes=DemoController.class)
public class DemoErrors {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> invalid(MethodArgumentNotValidException e) {
        var problem=ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"Revisa los datos ingresados");
        problem.setProperty("code","VALIDATION_ERROR");
        problem.setProperty("fieldErrors",e.getBindingResult().getFieldErrors().stream().collect(Collectors.toMap(
            error -> error.getField(), error -> error.getDefaultMessage() == null ? "Invalido" : error.getDefaultMessage(), (a,b)->a)));
        return ResponseEntity.badRequest().body(problem);
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> status(ResponseStatusException e) {
        var problem=ProblemDetail.forStatusAndDetail(e.getStatusCode(),e.getReason());
        problem.setProperty("code","DEMO_REQUEST_ERROR");
        return ResponseEntity.status(e.getStatusCode()).body(problem);
    }
}
