package com.gmao.gmao_backend.user;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> findAll() {
        List<UserSummaryResponse> users = userRepository.findAll()
                .stream()
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getPhoto(),
                        Boolean.TRUE.equals(user.getActive())
                ))
                .toList();

        return ResponseEntity.ok(users);
    }

    @GetMapping("/detailed")
    public ResponseEntity<List<UserDetailResponse>> findAllDetailed() {
        return ResponseEntity.ok(userService.findAllDetailed());
    }

    @PostMapping
    public ResponseEntity<UserDetailResponse> invite(@RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.invite(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDetailResponse> update(
            @PathVariable Long id,
            @RequestBody UserRequest request
    ) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
