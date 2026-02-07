"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    // Fetch the OpenAPI spec from the API endpoint
    fetch("/api/openapi.json")
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error("Failed to load OpenAPI spec:", err));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DataHub API Documentation</h1>
          <p className="text-lg text-gray-600">
            Complete API reference for the DataHub centralized metadata hub
          </p>
        </div>

        {spec ? (
          <SwaggerUI spec={spec} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading API documentation...</div>
          </div>
        )}
      </div>
    </div>
  );
}
