package com.gmao.gmao_backend.activity;

import com.gmao.gmao_backend.measure.Measure;
import com.gmao.gmao_backend.measure.MeasureRepository;
import com.gmao.gmao_backend.sparepart.SparePart;
import com.gmao.gmao_backend.sparepart.SparePartRepository;
import com.gmao.gmao_backend.sparepart.SparePartStockMovement;
import com.gmao.gmao_backend.sparepart.SparePartStockMovementRepository;
import com.gmao.gmao_backend.storage.DatabaseFile;
import com.gmao.gmao_backend.storage.OfficePreviewService;
import com.gmao.gmao_backend.storage.ServedDatabaseFile;
import com.gmao.gmao_backend.task.Task;
import com.gmao.gmao_backend.task.TaskRepository;
import com.gmao.gmao_backend.task.TaskStatus;
import com.gmao.gmao_backend.user.User;
import com.gmao.gmao_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
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
    private final ActivityDocumentStorageService activityDocumentStorageService;
    private final ActivityDocumentRepository activityDocumentRepository;
    private final OfficePreviewService officePreviewService;
    private final MeasureRepository measureRepository;
    private final SparePartStockMovementRepository stockMovementRepository;

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

    public ServedDatabaseFile getDocument(Long documentId) {
        ActivityDocument document = activityDocumentRepository
                .findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable."));

        if (document.getFileData() == null || document.getFileData().length == 0) {
            throw new IllegalArgumentException("Fichier introuvable.");
        }

        return new ServedDatabaseFile(
                document.getFileName(),
                document.getFileType(),
                document.getFileData()
        );
    }

    public ServedDatabaseFile getDocumentPreview(Long documentId) {
        ActivityDocument document = activityDocumentRepository
                .findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable."));

        if (document.getPreviewFileData() == null || document.getPreviewFileData().length == 0) {
            throw new IllegalArgumentException("Apercu introuvable.");
        }

        return new ServedDatabaseFile(
                document.getFileName().replaceFirst("\\.[^.]+$", ".pdf"),
                document.getPreviewFileType(),
                document.getPreviewFileData()
        );
    }

    public ActivityResponse create(ActivityRequest request) {
        return create(request, null);
    }

    public ActivityResponse create(ActivityRequest request, List<MultipartFile> documents) {
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
        saveDocuments(savedActivity, documents);

        return toResponse(savedActivity);
    }

    public ActivityResponse createForTask(Long taskId, ActivityRequest request) {
        return createForTask(taskId, request, null);
    }

    public ActivityResponse createForTask(Long taskId, ActivityRequest request, List<MultipartFile> documents) {
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

        return create(normalizedRequest, documents);
    }

    public ActivityResponse createForTaskAndFinish(Long taskId, ActivityRequest request) {
        return createForTaskAndFinish(taskId, request, null);
    }

    public ActivityResponse createForTaskAndFinish(Long taskId, ActivityRequest request, List<MultipartFile> documents) {
        ActivityResponse response = createForTask(taskId, request, documents);

        Task task = findTask(taskId);
        task.setStatus(TaskStatus.DONE);
        taskRepository.save(task);

        return response;
    }

    public ActivityResponse update(Long id, ActivityRequest request) {
        return update(id, request, null);
    }

    public ActivityResponse update(Long id, ActivityRequest request, List<MultipartFile> documents) {
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

        restoreSpareParts(savedActivity.getId());

        activitySparePartRepository.deleteByActivityId(savedActivity.getId());
        activityIntervenantRepository.deleteByActivityId(savedActivity.getId());
        activityAdditionalCostRepository.deleteByActivityId(savedActivity.getId());
        activityMeasureReadingRepository.deleteByActivityId(savedActivity.getId());

        saveActivityDetails(savedActivity, request);
        saveDocuments(savedActivity, documents);

        return toResponse(savedActivity);
    }

    /**
     * Before replacing an activity's spare part lines on update, put the
     * previously consumed quantities back in stock (with a matching
     * correction movement), so editing an activity never double-counts
     * stock consumption.
     */
    private void restoreSpareParts(Long activityId) {
        List<ActivitySparePart> existingLines = activitySparePartRepository.findByActivityId(activityId);

        for (ActivitySparePart line : existingLines) {
            SparePart sparePart = line.getSparePart();

            BigDecimal currentStock = sparePart.getQuantity() == null
                    ? BigDecimal.ZERO
                    : sparePart.getQuantity();
            sparePart.setQuantity(currentStock.add(BigDecimal.valueOf(line.getQuantity())));
            sparePartRepository.save(sparePart);

            SparePartStockMovement movement = SparePartStockMovement.builder()
                    .sparePart(sparePart)
                    .source("Activité")
                    .reference("Correction activité #" + activityId)
                    .taskId(
                            line.getActivity() != null && line.getActivity().getTask() != null
                                    ? line.getActivity().getTask().getId()
                                    : null
                    )
                    .taskDescription(
                            line.getActivity() != null && line.getActivity().getTask() != null
                                    ? line.getActivity().getTask().getDescription()
                                    : null
                    )
                    .activityId(activityId)
                    .activityDescription(
                            line.getActivity() != null ? line.getActivity().getDescription() : null
                    )
                    .movementType("CORRECTION")
                    .quantity(BigDecimal.valueOf(line.getQuantity()))
                    .unitCost(sparePart.getUnitPrice())
                    .userName(currentUserName())
                    .movementDate(LocalDateTime.now())
                    .build();

            stockMovementRepository.save(movement);
        }
    }

    public ActivityResponse updateStatus(Long id, ActivityStatus status) {
        Activity activity = findActivity(id);
        activity.setStatus(status);

        return toResponse(activityRepository.save(activity));
    }

    public void delete(Long id) {
        Activity activity = findActivity(id);
        restoreSpareParts(id);
        deleteDocuments(activity);
        activityRepository.delete(activity);
    }

    private void saveActivityDetails(Activity activity, ActivityRequest request) {
        saveSpareParts(activity, request.spareParts());
        saveIntervenants(activity, request.intervenantIds());
        saveAdditionalCosts(activity, request.additionalCosts());
        saveMeasureReadings(activity, request.measureReadings());
    }

    private void saveDocuments(Activity activity, List<MultipartFile> documents) {
        if (documents == null) {
            return;
        }

        for (MultipartFile file : documents) {
            DatabaseFile databaseFile = activityDocumentStorageService.save(file);

            if (databaseFile == null) {
                continue;
            }

            ActivityDocument document = ActivityDocument.builder()
                    .activity(activity)
                    .fileName(databaseFile.fileName())
                    .filePath("db-file")
                    .fileType(databaseFile.contentType())
                    .fileSize((long) databaseFile.data().length)
                    .fileData(databaseFile.data())
                    .build();

            officePreviewService.createPdfPreview(databaseFile)
                    .ifPresent(preview -> {
                        document.setPreviewFileType(preview.contentType());
                        document.setPreviewFileSize((long) preview.data().length);
                        document.setPreviewFileData(preview.data());
                    });

            activity.getDocuments().add(document);
        }

        activityRepository.save(activity);
    }

    private void deleteDocuments(Activity activity) {
        if (activity.getDocuments() == null) {
            return;
        }

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

            BigDecimal currentStock = sparePart.getQuantity() == null
                    ? BigDecimal.ZERO
                    : sparePart.getQuantity();
            sparePart.setQuantity(currentStock.subtract(BigDecimal.valueOf(quantity)));
            sparePartRepository.save(sparePart);

            SparePartStockMovement movement = SparePartStockMovement.builder()
                    .sparePart(sparePart)
                    .source("Activité")
                    .reference("Activité #" + activity.getId())
                    .taskId(activity.getTask() != null ? activity.getTask().getId() : null)
                    .taskDescription(
                            activity.getTask() != null ? activity.getTask().getDescription() : null
                    )
                    .activityId(activity.getId())
                    .activityDescription(activity.getDescription())
                    .movementType("CONSOMMATION")
                    .quantity(BigDecimal.valueOf(quantity).negate())
                    .unitCost(sparePart.getUnitPrice())
                    .userName(currentUserName())
                    .movementDate(LocalDateTime.now())
                    .build();

            stockMovementRepository.save(movement);
        }
    }

    private String currentUserName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        return userRepository.findByEmail(authentication.getName())
                .map(user -> (user.getFirstName() + " " + user.getLastName()).trim())
                .orElse(null);
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
                getDocumentResponses(activity),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }

    private List<ActivityDocumentResponse> getDocumentResponses(Activity activity) {
        if (activity.getDocuments() == null) {
            return List.of();
        }

        return activity.getDocuments()
                .stream()
                .sorted(Comparator.comparing(
                        ActivityDocument::getUploadedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .map(document -> new ActivityDocumentResponse(
                        document.getId(),
                        document.getFileName(),
                        "/api/activities/documents/" + document.getId(),
                        document.getFileType(),
                        document.getPreviewFileData() != null
                                ? "/api/activities/documents/" + document.getId() + "/preview"
                                : null,
                        document.getPreviewFileType(),
                        document.getUploadedAt()
                ))
                .toList();
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
