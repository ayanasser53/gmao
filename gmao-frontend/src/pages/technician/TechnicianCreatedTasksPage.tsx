import OperatorTasksPage from "../operator/OperatorTasksPage";

function TechnicianCreatedTasksPage() {
  return (
    <OperatorTasksPage
      dataSource="created"
      title="Taches creees"
      detailPathPrefix="/technician/created-tasks"
      createPath="/technician/created-tasks/new"
    />
  );
}

export default TechnicianCreatedTasksPage;
