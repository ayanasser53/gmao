package com.gmao.gmao_backend.user;

import com.gmao.gmao_backend.security.CurrentUserProvider;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> findAll() {
        Long usineId = currentUserProvider.getUsineIdOrNull();

        List<User> users = usineId == null
                ? userRepository.findAll()
                : userRepository.findAllByUsineId(usineId);

        List<UserSummaryResponse> response = users.stream()
                .map(user -> new UserSummaryResponse(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getPhoto(),
                        Boolean.TRUE.equals(user.getActive())
                ))
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/detailed")
    public ResponseEntity<List<UserDetailResponse>> findAllDetailed() {
        return ResponseEntity.ok(userService.findAllDetailed());
    }

    @GetMapping("/me")
    public ResponseEntity<UserDetailResponse> findCurrentUser() {
        return ResponseEntity.ok(userService.findCurrentUser());
    }

    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<UserInviteResponse> invite(@RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.invite(request));
    }

    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<UserDetailResponse> update(
            @PathVariable Long id,
            @RequestBody UserRequest request
    ) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @PatchMapping("/{id}/active")
    public ResponseEntity<UserDetailResponse> setActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {
        return ResponseEntity.ok(userService.setActive(id, active));
    }

}
