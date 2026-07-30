import OperatorTaskDetailsPage from "../operator/OperatorTaskDetailsPage";

function TechnicianCreatedTaskDetailsPage() {
  return (
    <OperatorTaskDetailsPage
      backPath="/technician/created-tasks"
      dataSource="created"
    />
  );
}

export default TechnicianCreatedTaskDetailsPage;
