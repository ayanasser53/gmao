package com.gmao.gmao_backend.activity;

import com.gmao.gmao_backend.measure.Measure;
import com.gmao.gmao_backend.measure.MeasureRepository;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;
import com.gmao.gmao_backend.task.Task;
import com.gmao.gmao_backend.task.TaskRepository;
import com.gmao.gmao_backend.task.TaskStatus;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final TaskRepository taskRepository;
    private final SparePartRepository sparePartRepository;
    private final UserRepository userRepository;
    private final ActivitySparePartRepository activitySparePartRepository;
    private final ActivityIntervenantRepository activityIntervenantRepository;
    private final ActivityAdditionalCostRepository activityAdditionalCostRepository;
    private final ActivityMeasureReadingRepository activityMeasureReadingRepository;
    private final MeasureRepository measureRepository;

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

        Activity savedActivity = activityRepository.save(activity);
        saveActivityDetails(savedActivity, request);

        return toResponse(savedActivity);
    }

    public ActivityResponse createForTask(Long taskId, ActivityRequest request) {
        ActivityRequest normalizedRequest = new ActivityRequest(
                taskId,
                request.description(),
                request.performedDate(),
                request.performedEndTime(),
                request.spentHours(),
                request.spentMinutes(),
                request.status(),
                request.spareParts(),
                request.intervenantIds(),
                request.additionalCosts(),
                request.measureReadings()
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

        Activity savedActivity = activityRepository.save(activity);

        activitySparePartRepository.deleteByActivityId(savedActivity.getId());
        activityIntervenantRepository.deleteByActivityId(savedActivity.getId());
        activityAdditionalCostRepository.deleteByActivityId(savedActivity.getId());
        activityMeasureReadingRepository.deleteByActivityId(savedActivity.getId());

        saveActivityDetails(savedActivity, request);

        return toResponse(savedActivity);
    }

    public ActivityResponse updateStatus(Long id, ActivityStatus status) {
        Activity activity = findActivity(id);
        activity.setStatus(status);

        return toResponse(activityRepository.save(activity));
    }

    public void delete(Long id) {
        activityRepository.delete(findActivity(id));
    }

    private void saveActivityDetails(Activity activity, ActivityRequest request) {
        saveSpareParts(activity, request.spareParts());
        saveIntervenants(activity, request.intervenantIds());
        saveAdditionalCosts(activity, request.additionalCosts());
        saveMeasureReadings(activity, request.measureReadings());
    }

    private void saveSpareParts(Activity activity, List<ActivitySparePartRequest> spareParts) {
        if (spareParts == null) {
            return;
        }

        for (ActivitySparePartRequest item : spareParts) {
            if (item.sparePartId() == null) {
                continue;
            }

            SparePart sparePart = sparePartRepository.findById(item.sparePartId())
                    .orElseThrow(() -> new IllegalArgumentException("Pièce détachée introuvable."));

            int quantity = item.quantity() > 0 ? item.quantity() : 1;

            ActivitySparePart activitySparePart = ActivitySparePart.builder()
                    .id(new ActivitySparePartId(activity.getId(), sparePart.getId()))
                    .activity(activity)
                    .sparePart(sparePart)
                    .quantity(quantity)
                    .build();

            activitySparePartRepository.save(activitySparePart);
        }
    }

    private void saveIntervenants(Activity activity, List<Long> intervenantIds) {
        if (intervenantIds == null) {
            return;
        }

        for (Long userId : intervenantIds) {
            if (userId == null) {
                continue;
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Intervenant introuvable."));

            ActivityIntervenant intervenant = ActivityIntervenant.builder()
                    .id(new ActivityIntervenantId(activity.getId(), user.getId()))
                    .activity(activity)
                    .user(user)
                    .build();

            activityIntervenantRepository.save(intervenant);
        }
    }

    private void saveAdditionalCosts(Activity activity, List<ActivityAdditionalCostRequest> costs) {
        if (costs == null) {
            return;
        }

        for (ActivityAdditionalCostRequest item : costs) {
            if (item.label() == null || item.label().isBlank() || item.amount() == null) {
                continue;
            }

            ActivityAdditionalCost cost = ActivityAdditionalCost.builder()
                    .activity(activity)
                    .label(item.label())
                    .amount(item.amount())
                    .currency(item.currency() != null && !item.currency().isBlank() ? item.currency() : "EUR")
                    .build();

            activityAdditionalCostRepository.save(cost);
        }
    }

    private void saveMeasureReadings(Activity activity, List<ActivityMeasureReadingRequest> readings) {
        if (readings == null) {
            return;
        }

        for (ActivityMeasureReadingRequest item : readings) {
            if (item.measureId() == null || item.value() == null
                    || item.readingDate() == null || item.readingHour() == null) {
                continue;
            }

            Measure measure = measureRepository.findById(item.measureId())
                    .orElseThrow(() -> new IllegalArgumentException("Mesure introuvable."));

            ActivityMeasureReading reading = ActivityMeasureReading.builder()
                    .activity(activity)
                    .measure(measure)
                    .value(item.value())
                    .readingDate(item.readingDate())
                    .readingHour(item.readingHour())
                    .build();

            activityMeasureReadingRepository.save(reading);
        }
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
                getSparePartResponses(activity.getId()),
                getIntervenantResponses(activity.getId()),
                getAdditionalCostResponses(activity.getId()),
                getMeasureReadingResponses(activity.getId()),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }

    private List<ActivitySparePartResponse> getSparePartResponses(Long activityId) {
        return activitySparePartRepository.findByActivityId(activityId)
                .stream()
                .map(item -> new ActivitySparePartResponse(
                        item.getSparePart().getId(),
                        item.getSparePart().getName(),
                        item.getSparePart().getCode(),
                        item.getQuantity(),
                        item.getSparePart().getUnitPrice(),
                        item.getSparePart().getCurrency()
                ))
                .toList();
    }

    private List<ActivityIntervenantResponse> getIntervenantResponses(Long activityId) {
        return activityIntervenantRepository.findByActivityId(activityId)
                .stream()
                .map(item -> new ActivityIntervenantResponse(
                        item.getUser().getId(),
                        item.getUser().getFirstName(),
                        item.getUser().getLastName(),
                        item.getUser().getEmail()
                ))
                .toList();
    }

    private List<ActivityAdditionalCostResponse> getAdditionalCostResponses(Long activityId) {
        return activityAdditionalCostRepository.findByActivityId(activityId)
                .stream()
                .map(item -> new ActivityAdditionalCostResponse(
                        item.getId(),
                        item.getLabel(),
                        item.getAmount(),
                        item.getCurrency()
                ))
                .toList();
    }

    private List<ActivityMeasureReadingResponse> getMeasureReadingResponses(Long activityId) {
        return activityMeasureReadingRepository.findByActivityId(activityId)
                .stream()
                .map(item -> new ActivityMeasureReadingResponse(
                        item.getId(),
                        item.getMeasure().getId(),
                        item.getMeasure().getName(),
                        item.getMeasure().getUnit().getSymbol(),
                        item.getValue(),
                        item.getReadingDate(),
                        item.getReadingHour()
                ))
                .toList();
    }
}