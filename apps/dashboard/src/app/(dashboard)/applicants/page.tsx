export default function ApplicantsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Applicants</h1>
      <p className="mt-2 text-gray-600">
        This section will display the list of applicants from the database.
      </p>
      {/* Placeholder for the applicants table */}
      <div className="mt-8">
        <div className="p-4 bg-gray-100 rounded-lg">
          <p>Applicants data will be loaded here...</p>
        </div>
      </div>
    </div>
  );
}
