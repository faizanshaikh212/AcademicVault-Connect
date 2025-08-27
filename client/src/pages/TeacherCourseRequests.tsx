import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Search, Filter, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

const TeacherCourseRequests: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [requests] = useState([]); // Replace with actual API data

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage student enrollment requests
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md">
        {/* Filters & Search */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-5 gap-4 p-4 text-sm font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-800">
          <div>Student</div>
          <div>Course</div>
          <div>Semester</div>
          <div>Requested Date</div>
          <div>Actions</div>
        </div>

        {/* Content */}
        {requests.length === 0 ? (
          <div className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No pending requests
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Course enrollment requests from students will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-800">
            {/* Request rows will go here */}
            {requests.map((request: any) => (
              <div
                key={request.id}
                className="grid grid-cols-5 gap-4 p-4 items-center"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={request.student.avatar}
                    alt={request.student.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{request.student.name}</p>
                    <p className="text-sm text-gray-500">
                      @{request.student.username}
                    </p>
                  </div>
                </div>
                <div>{request.course}</div>
                <div>Semester {request.semester}</div>
                <div>{request.requestDate}</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherCourseRequests;
