import { objectId, throwInternalError } from '../../helpers';
import { IAuthUser } from '../../types';
import { EBookStatus } from '../Book/book.interface';
import Book from '../Book/book.model';
import { EBookCopyStatus } from '../BookCopy/book-copy.interface';
import BookCopy from '../BookCopy/book-copy.model';
import BookReview from '../BookReview/book-review.model';
import { EBorrowRecordStatus } from '../BorrowRecord/borrow-record.interface';
import BorrowRecord from '../BorrowRecord/borrow-record.model';
import { EBorrowRequestStatus } from '../BorrowRequest/borrow-request.interface';
import BorrowRequest from '../BorrowRequest/borrow-request.model';
import { EFineStatus } from '../Fine/fine.interface';
import Fine from '../Fine/fine.model';
import { Student } from '../Student/student.model';
import { EStudentRegistrationRequestStatus } from '../StudentRegistrationRequest/student-registration-request.interface';
import StudentRegistrationRequest from '../StudentRegistrationRequest/studentRegistrationRequest.model';
import { EUserRole, EUserStatus } from '../User/user.interface';
import User from '../User/user.model';

class StatisticService {
  async getGlobalSummary() {
    const group = await User.aggregate([
      {
        $match: {
          status: { $ne: EUserStatus.DELETED },
        },
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalStudents = group.find((_) => _._id === EUserRole.STUDENT)?.count || 0;
    const totalLibrarians = group.find((_) => _._id === EUserRole.LIBRARIAN)?.count || 0;
    const totalAdministrators = group
      .filter((_) => [EUserRole.SUPER_ADMIN, EUserRole.ADMIN].includes(_._id))
      .reduce((acc, cur) => acc + cur.count, 0);
    const totalUsers = group.reduce((sum, roleGroup) => sum + roleGroup.count, 0);
    const totalBooks = await Book.countDocuments({ status: { $ne: EBookStatus.DELETED } });
    const totalBookReviews = await BookReview.countDocuments();
    const totalActiveBorrows = await BorrowRecord.countDocuments({
      status: { $nin: [EBorrowRecordStatus.LOST, EBorrowRecordStatus.RETURNED] },
    });
    const totalPendingBorrowRequests = await BorrowRequest.countDocuments({
      status: EBorrowRequestStatus.PENDING,
    });

    const totalFineCollection =
      (
        await Fine.aggregate([
          {
            $match: {
              status: EFineStatus.PAID,
            },
          },

          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$fine' },
            },
          },
        ])
      )[0].totalAmount || 0;

    const totalPendingFine =
      (
        await Fine.aggregate([
          {
            $match: {
              status: EFineStatus.UNPAID,
            },
          },

          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$fine' },
            },
          },
        ])
      )[0].totalAmount || 0;

    return {
      totalUsers,
      totalStudents,
      totalLibrarians,
      totalAdministrators,
      totalBooks,
      totalBookReviews,
      totalActiveBorrows,
      totalPendingBorrowRequests,
      totalFineCollection,
      totalPendingFine,
    };
  }

  async getStudentActivitySummary(authUser: IAuthUser) {
    const totalActiveBorrow = await BorrowRecord.countDocuments({
      student: objectId(authUser.profileId),
      status: { $nin: [EBorrowRecordStatus.LOST, EBorrowRecordStatus.RETURNED] },
    });

    const totalOverdueBorrow = await BorrowRecord.countDocuments({
      student: objectId(authUser.profileId),
      overDueDays: {
        $lte: new Date(),
      },
    }).countDocuments();

    const totalPendingFine =
      (
        await Fine.aggregate([
          {
            $match: {
              student: objectId(authUser.profileId),
              status: EFineStatus.UNPAID,
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$fine' },
            },
          },
        ])
      )[0].totalAmount || 0;

    return {
      totalActiveBorrow,
      totalOverdueBorrow,
      totalPendingFine,
    };
  }

  async getSummaryForLibrarian() {
    const totalBooks = await Book.countDocuments({ status: { $ne: EBookStatus.DELETED } });
    const totalBookReviews = await BookReview.countDocuments();
    const totalActiveBorrows = await BorrowRecord.countDocuments({
      status: { $nin: [EBorrowRecordStatus.LOST, EBorrowRecordStatus.RETURNED] },
    });
    const totalPendingBorrowRequests = await BorrowRequest.countDocuments({
      status: EBorrowRequestStatus.PENDING,
    });

    const totalPendingFineAmount =
      (
        await Fine.aggregate([
          {
            $match: {
              status: EFineStatus.UNPAID,
            },
          },

          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$fine' },
            },
          },
        ])
      )[0].totalAmount || 0;

    return {
      totalBooks,
      totalBookReviews,
      totalActiveBorrows,
      totalPendingBorrowRequests,
      totalPendingFineAmount,
    };
  }
  async getStudentMonthlyBorrowActivity(authUser: IAuthUser, range: string | number) {
    if (!range) {
      range = 6;
    }
    range = Number(range);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - range);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();

    try {
      const activity = await BorrowRecord.aggregate([
        {
          $match: {
            student: objectId(authUser.profileId),
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]);

      // Format the output as YYYY-MM: count
      const monthlyBreakdown: Record<string, number> = {};
      for (const entry of activity) {
        const { year, month } = entry._id;
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        monthlyBreakdown[key] = entry.count;
      }

      return {
        rangeInMonths: range,
        totalMonths: Object.keys(monthlyBreakdown).length,
        monthlyBreakdown,
      };
    } catch (error) {
      throwInternalError();
    }
  }
  async getMonthlyBorrowActivity(range: string | number) {
    if (!range) {
      range = 6;
    }
    range = Number(range);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - range);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();

    try {
      const activity = await BorrowRecord.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]);

      // Format the output as YYYY-MM: count
      const monthlyBreakdown: Record<string, number> = {};
      for (const entry of activity) {
        const { year, month } = entry._id;
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        monthlyBreakdown[key] = entry.count;
      }

      return {
        rangeInMonths: range,
        totalMonths: Object.keys(monthlyBreakdown).length,
        monthlyBreakdown,
      };
    } catch (error) {
      throwInternalError();
    }
  }
  async getBooksSummary() {
    try {
      // Aggregate Book statuses (excluding deleted)
      const bookStatusSummary: { _id: EBookStatus; count: number }[] = await Book.aggregate([
        { $match: { status: { $ne: EBookStatus.DELETED } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const bookCounts: Record<EBookStatus, number> = Object.fromEntries(
        bookStatusSummary.map(({ _id, count }) => [_id, count])
      ) as Record<EBookStatus, number>;

      const totalBooks = Object.values(bookCounts).reduce((sum, count) => sum + count, 0);
      const totalActiveBooks = bookCounts[EBookStatus.ACTIVE] || 0;
      const totalInactiveBooks = totalBooks - totalActiveBooks;

      // Aggregate BookCopy statuses (excluding deleted)
      const bookCopySummary: { _id: EBookCopyStatus; count: number }[] = await BookCopy.aggregate([
        { $match: { status: { $ne: EBookCopyStatus.DELETED } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const copyCounts: Record<EBookCopyStatus, number> = Object.fromEntries(
        bookCopySummary.map(({ _id, count }) => [_id, count])
      ) as Record<EBookCopyStatus, number>;

      return {
        totalBooks,
        totalActiveBooks,
        totalInactiveBooks,
        totalCopies: Object.values(copyCounts).reduce((sum, count) => sum + count, 0),
        totalAvailableCopies: copyCounts[EBookCopyStatus.AVAILABLE] || 0,
        totalReservedCopies: copyCounts[EBookCopyStatus.RESERVED] || 0,
        totalCheckedOutCopies: copyCounts[EBookCopyStatus.CHECKED_OUT] || 0,
        totalLostCopies: copyCounts[EBookCopyStatus.LOST] || 0,
      };
    } catch (error) {
      console.error('Failed to get books summary:', error);
      throw new Error('Unable to retrieve books summary.');
    }
  }

  async getStudentsSummary() {
    const studentStatusSummary = await User.aggregate([
      {
        $match: {
          role: EUserRole.STUDENT,
          $ne: EUserStatus.DELETED,
        },
      },
      {
        $group: {
          _id: '$status',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    const studentCounts = Object.fromEntries(
      studentStatusSummary.map(({ _id, count }) => [_id, count])
    ) as Record<EUserStatus, number>;

    const totalPendingRegistrationRequests = await StudentRegistrationRequest.countDocuments({
      status: EStudentRegistrationRequestStatus.PENDING,
    });
    return {
      totalStudents: Object.values(studentCounts).reduce((sum, count) => sum + count, 0),
      totalActiveStudents: studentCounts[EUserStatus.ACTIVE] || 0,
      totalBlockedStudents: studentCounts[EUserStatus.BLOCKED] || 0,
      totalPendingRegistrationRequests,
    };
  }

  async getMonthlyStudentRegistrationActivity(range: string | number) {
    if (!range) {
      range = 6;
    }
    range = Number(range);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - range);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();

    try {
      const activity = await Student.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]);

      // Format the output as YYYY-MM: count
      const monthlyBreakdown: Record<string, number> = {};
      for (const entry of activity) {
        const { year, month } = entry._id;
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        monthlyBreakdown[key] = entry.count;
      }

      return {
        rangeInMonths: range,
        totalMonths: Object.keys(monthlyBreakdown).length,
        monthlyBreakdown,
      };
    } catch (error) {
      throwInternalError();
    }
  }
}

export default new StatisticService();
