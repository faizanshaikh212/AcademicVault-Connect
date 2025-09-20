/**
 * Role Access Validation Script
 * Validates that role-based access control is working correctly
 */

import {
    hasRole,
    hasAnyRole,
    getHighestRole,
    shouldUseTeacherPrivileges,
    shouldUseAdminPrivileges,
    getAcademicNoteDefaults,
    isValidRoleArray,
    logRoleCheck
} from '../utils/roleUtils.js';

// Test cases for role validation
const testCases = [
    {
        name: 'Student Only',
        roles: ['student'],
        expectedResults: {
            hasStudent: true,
            hasTeacher: false,
            hasAdmin: false,
            hasTeacherPrivileges: false,
            hasAdminPrivileges: false,
            highestRole: 'student',
            noteDefaults: {
                status: "In for Review",
                type: "Unofficial",
                isAdminUploaded: false,
                isApproved: false
            }
        }
    },
    {
        name: 'Teacher Only',
        roles: ['teacher'],
        expectedResults: {
            hasStudent: false,
            hasTeacher: true,
            hasAdmin: false,
            hasTeacherPrivileges: true,
            hasAdminPrivileges: false,
            highestRole: 'teacher',
            noteDefaults: {
                status: "Approved",
                type: "Official",
                isAdminUploaded: false,
                isApproved: true
            }
        }
    },
    {
        name: 'Admin Only',
        roles: ['admin'],
        expectedResults: {
            hasStudent: false,
            hasTeacher: false,
            hasAdmin: true,
            hasTeacherPrivileges: true,
            hasAdminPrivileges: true,
            highestRole: 'admin',
            noteDefaults: {
                status: "Approved",
                type: "Official",
                isAdminUploaded: true,
                isApproved: true
            }
        }
    },
    {
        name: 'Student + Teacher (Teacher Precedence)',
        roles: ['student', 'teacher'],
        expectedResults: {
            hasStudent: true,
            hasTeacher: true,
            hasAdmin: false,
            hasTeacherPrivileges: true,
            hasAdminPrivileges: false,
            highestRole: 'teacher',
            noteDefaults: {
                status: "Approved",
                type: "Official",
                isAdminUploaded: false,
                isApproved: true
            }
        }
    },
    {
        name: 'Teacher + Admin (Admin Precedence)',
        roles: ['teacher', 'admin'],
        expectedResults: {
            hasStudent: false,
            hasTeacher: true,
            hasAdmin: true,
            hasTeacherPrivileges: true,
            hasAdminPrivileges: true,
            highestRole: 'admin',
            noteDefaults: {
                status: "Approved",
                type: "Official",
                isAdminUploaded: true,
                isApproved: true
            }
        }
    },
    {
        name: 'All Roles (Admin Precedence)',
        roles: ['student', 'teacher', 'admin'],
        expectedResults: {
            hasStudent: true,
            hasTeacher: true,
            hasAdmin: true,
            hasTeacherPrivileges: true,
            hasAdminPrivileges: true,
            highestRole: 'admin',
            noteDefaults: {
                status: "Approved",
                type: "Official",
                isAdminUploaded: true,
                isApproved: true
            }
        }
    },
    {
        name: 'Empty Roles',
        roles: [],
        expectedResults: {
            hasStudent: false,
            hasTeacher: false,
            hasAdmin: false,
            hasTeacherPrivileges: false,
            hasAdminPrivileges: false,
            highestRole: null,
            noteDefaults: {
                status: "In for Review",
                type: "Unofficial",
                isAdminUploaded: false,
                isApproved: false
            }
        }
    }
];

/**
 * Run validation tests
 */
function runValidationTests() {
    console.log('🔐 Starting Role Access Control Validation...\n');

    let passedTests = 0;
    let totalTests = 0;

    testCases.forEach((testCase, index) => {
        console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
        console.log(`   Roles: [${testCase.roles.join(', ')}]`);

        const results = {
            hasStudent: hasRole(testCase.roles, 'student'),
            hasTeacher: hasRole(testCase.roles, 'teacher'),
            hasAdmin: hasRole(testCase.roles, 'admin'),
            hasTeacherPrivileges: shouldUseTeacherPrivileges(testCase.roles),
            hasAdminPrivileges: shouldUseAdminPrivileges(testCase.roles),
            highestRole: getHighestRole(testCase.roles),
            noteDefaults: getAcademicNoteDefaults(testCase.roles)
        };

        // Compare results
        let testPassed = true;
        const failures = [];

        Object.keys(testCase.expectedResults).forEach(key => {
            if (key === 'noteDefaults') {
                // Deep compare note defaults
                const expected = testCase.expectedResults[key];
                const actual = results[key];

                Object.keys(expected).forEach(noteKey => {
                    totalTests++;
                    if (expected[noteKey] !== actual[noteKey]) {
                        testPassed = false;
                        failures.push(`${key}.${noteKey}: expected ${expected[noteKey]}, got ${actual[noteKey]}`);
                    } else {
                        passedTests++;
                    }
                });
            } else {
                totalTests++;
                if (testCase.expectedResults[key] !== results[key]) {
                    testPassed = false;
                    failures.push(`${key}: expected ${testCase.expectedResults[key]}, got ${results[key]}`);
                } else {
                    passedTests++;
                }
            }
        });

        if (testPassed) {
            console.log('   ✅ PASSED');
        } else {
            console.log('   ❌ FAILED');
            failures.forEach(failure => {
                console.log(`      - ${failure}`);
            });
        }

        // Log role check for debugging
        logRoleCheck(
            'test-user',
            testCase.roles,
            'validation-test',
            testPassed,
            `Validation Test: ${testCase.name}`
        );
    });

    console.log('\n📊 Validation Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! Role-based access control is working correctly.');
        return true;
    } else {
        console.log('\n⚠️  Some tests failed. Please review the role validation logic.');
        return false;
    }
}

/**
 * Test edge cases
 */
function testEdgeCases() {
    console.log('\n🧪 Testing Edge Cases...\n');

    const edgeCases = [
        {
            name: 'Null roles',
            input: null,
            test: () => {
                const result = isValidRoleArray(null);
                return result === false;
            }
        },
        {
            name: 'Undefined roles',
            input: undefined,
            test: () => {
                const result = isValidRoleArray(undefined);
                return result === false;
            }
        },
        {
            name: 'String instead of array',
            input: 'teacher',
            test: () => {
                const result = isValidRoleArray('teacher');
                return result === false;
            }
        },
        {
            name: 'Invalid role in array',
            input: ['student', 'invalid-role'],
            test: () => {
                const result = isValidRoleArray(['student', 'invalid-role']);
                return result === false;
            }
        },
        {
            name: 'Valid role array',
            input: ['student', 'teacher', 'admin'],
            test: () => {
                const result = isValidRoleArray(['student', 'teacher', 'admin']);
                return result === true;
            }
        }
    ];

    let passedEdgeTests = 0;

    edgeCases.forEach((edgeCase, index) => {
        console.log(`   Edge Case ${index + 1}: ${edgeCase.name}`);

        try {
            const passed = edgeCase.test();
            if (passed) {
                console.log('   ✅ PASSED');
                passedEdgeTests++;
            } else {
                console.log('   ❌ FAILED');
            }
        } catch (error) {
            console.log('   ❌ ERROR:', error.message);
        }
    });

    console.log(`\n   Edge Cases Passed: ${passedEdgeTests}/${edgeCases.length}`);

    return passedEdgeTests === edgeCases.length;
}

/**
 * Main validation function
 */
function validateRoleAccess() {
    console.log('🚀 Role-Based Access Control Validation\n');
    console.log('This script validates that the role precedence and access control logic is working correctly.\n');

    const mainTestsPassed = runValidationTests();
    const edgeTestsPassed = testEdgeCases();

    console.log('\n' + '='.repeat(60));

    if (mainTestsPassed && edgeTestsPassed) {
        console.log('🎯 VALIDATION SUCCESSFUL: Role-based access control is working correctly!');
        console.log('\nKey Features Validated:');
        console.log('✅ Teacher role grants teacher privileges');
        console.log('✅ Admin role grants both teacher and admin privileges');
        console.log('✅ Student+Teacher combination uses teacher precedence');
        console.log('✅ Academic notes use correct defaults based on role precedence');
        console.log('✅ Edge cases are handled gracefully');
        process.exit(0);
    } else {
        console.log('❌ VALIDATION FAILED: Issues found in role-based access control');
        console.log('\nPlease review the implementation and fix any issues before deploying.');
        process.exit(1);
    }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateRoleAccess();
}

export default {
    validateRoleAccess,
    runValidationTests,
    testEdgeCases
};