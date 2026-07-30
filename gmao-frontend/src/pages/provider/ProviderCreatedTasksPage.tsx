import OperatorTasksPage from "../operator/OperatorTasksPage";

function ProviderCreatedTasksPage() {
  return (
    <OperatorTasksPage
      dataSource="created"
      title="Taches creees"
      detailPathPrefix="/provider/created-tasks"
      createPath="/provider/created-tasks/new"
    />
  );
}

export default ProviderCreatedTasksPage;
