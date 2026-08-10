import React from 'react'
import {PersonalDetailsForm} from "@/features/org/components/PersonalDetailsForm"

export default function PersonalDetailsPage() {
  return (
    <div className="max-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Personal Details
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Please fill in your information below.
        </p>

        <PersonalDetailsForm />
      </div>
    </div>
  );
}