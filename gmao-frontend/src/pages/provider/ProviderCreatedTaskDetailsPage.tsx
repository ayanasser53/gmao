import OperatorTaskDetailsPage from "../operator/OperatorTaskDetailsPage";

function ProviderCreatedTaskDetailsPage() {
  return (
    <OperatorTaskDetailsPage
      backPath="/provider/created-tasks"
      dataSource="created"
    />
  );
}

export default ProviderCreatedTaskDetailsPage;
