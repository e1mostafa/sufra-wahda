namespace SufraWahda.Application.Common.Models;

// ─── Result Pattern ───────────────────────────────────────────────────────────
public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? Message { get; private set; }
    public List<string> Errors { get; private set; } = new();
    public int StatusCode { get; private set; }

    public static Result<T> Success(T data, string message = "تم بنجاح")
        => new() { IsSuccess = true, Data = data, Message = message, StatusCode = 200 };

    public static Result<T> Created(T data, string message = "تم الإنشاء بنجاح")
        => new() { IsSuccess = true, Data = data, Message = message, StatusCode = 201 };

    public static Result<T> Failure(string error, int statusCode = 400)
        => new() { IsSuccess = false, Errors = new List<string> { error }, StatusCode = statusCode };

    public static Result<T> Failure(List<string> errors, int statusCode = 400)
        => new() { IsSuccess = false, Errors = errors, StatusCode = statusCode };

    public static Result<T> NotFound(string message = "العنصر غير موجود")
        => new() { IsSuccess = false, Errors = new List<string> { message }, StatusCode = 404 };

    public static Result<T> Unauthorized(string message = "غير مصرح")
        => new() { IsSuccess = false, Errors = new List<string> { message }, StatusCode = 401 };

    public static Result<T> Forbidden(string message = "ممنوع")
        => new() { IsSuccess = false, Errors = new List<string> { message }, StatusCode = 403 };

    public static Result<T> Conflict(string message = "البيانات موجودة مسبقاً")
        => new() { IsSuccess = false, Errors = new List<string> { message }, StatusCode = 409 };
}

public class Result : Result<object>
{
    public static Result Ok(string message = "تم بنجاح") => new() { };
}

// ─── Paged Result ─────────────────────────────────────────────────────────────
public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;

    public static PagedResult<T> Create(IEnumerable<T> items, int total, int page, int pageSize)
        => new() { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string> Errors { get; set; } = new();
    public PaginationMeta? Pagination { get; set; }
    public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
}

public class PaginationMeta
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}
