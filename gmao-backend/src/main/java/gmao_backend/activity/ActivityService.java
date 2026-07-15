package com.gmao.gmao_backend.activity;

import com.gmao.gmao_backend.task.Task;
import com.gmao.gmao_backend.task.TaskRepository;
import com.gmao.gmao_backend.task.TaskStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final TaskRepository taskRepository;

    public List<ActivityResponse> findAll() {
        return activityRepository.findAllByOrderByPerformedDateDescPerformedEndTimeDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ActivityResponse> findInProgress() {
        return activityRepository.findByStatusOrderByPerformedDateDescPerformedEndTimeDesc(ActivityStatus.IN_PROGRESS)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ActivityResponse> findLate() {
        return activityRepository.findByStatusOrderByPerformedDateDescPerformedEndTimeDesc(ActivityStatus.LATE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ActivityResponse> findHistory() {
        return activityRepository.findByStatusOrderByPerformedDateDescPerformedEndTimeDesc(ActivityStatus.DONE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ActivityResponse> findByTaskId(Long taskId) {
        return activityRepository.findByTaskIdOrderByPerformedDateDescPerformedEndTimeDesc(taskId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ActivityResponse create(ActivityRequest request) {
        Task task = findTask(request.taskId());

        Activity activity = Activity.builder()
                .task(task)
                .description(request.description())
                .performedDate(request.performedDate())
                .performedEndTime(request.performedEndTime())
                .spentHours(request.spentHours())
                .spentMinutes(request.spentMinutes())
                .status(request.status() != null ? request.status() : ActivityStatus.IN_PROGRESS)
                .build();

        return toResponse(activityRepository.save(activity));
    }

    public ActivityResponse createForTask(Long taskId, ActivityRequest request) {
        ActivityRequest normalizedRequest = new ActivityRequest(
                taskId,
                request.description(),
                request.performedDate(),
                request.performedEndTime(),
                request.spentHours(),
                request.spentMinutes(),
                request.status()
        );

        return create(normalizedRequest);
    }

    public ActivityResponse createForTaskAndFinish(Long taskId, ActivityRequest request) {
        ActivityResponse response = createForTask(taskId, request);

        Task task = findTask(taskId);
        task.setStatus(TaskStatus.DONE);
        taskRepository.save(task);

        return response;
    }

    public ActivityResponse update(Long id, ActivityRequest request) {
        Activity activity = findActivity(id);
        Task task = findTask(request.taskId());

        activity.setTask(task);
        activity.setDescription(request.description());
        activity.setPerformedDate(request.performedDate());
        activity.setPerformedEndTime(request.performedEndTime());
        activity.setSpentHours(request.spentHours());
        activity.setSpentMinutes(request.spentMinutes());
        activity.setStatus(request.status() != null ? request.status() : activity.getStatus());

        return toResponse(activityRepository.save(activity));
    }

    public ActivityResponse updateStatus(Long id, ActivityStatus status) {
        Activity activity = findActivity(id);
        activity.setStatus(status);

        return toResponse(activityRepository.save(activity));
    }

    public void delete(Long id) {
        activityRepository.delete(findActivity(id));
    }

    private Task findTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Tâche introuvable."));
    }

    private Activity findActivity(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Activité introuvable."));
    }

    private ActivityResponse toResponse(Activity activity) {
        Task task = activity.getTask();

        return new ActivityResponse(
                activity.getId(),
                task.getId(),
                task.getDescription(),
                task.getEquipment() != null ? task.getEquipment().getName() : null,
                activity.getDescription(),
                activity.getPerformedDate(),
                activity.getPerformedEndTime(),
                activity.getSpentHours(),
                activity.getSpentMinutes(),
                activity.getStatus(),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }
}
