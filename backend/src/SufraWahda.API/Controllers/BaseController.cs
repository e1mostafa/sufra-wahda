using Microsoft.AspNetCore.Mvc;
using SufraWahda.Application.Common.Models;

namespace SufraWahda.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class BaseController : ControllerBase
{
    protected IActionResult FromResult<T>(Result<T> result)
    {
        var response = new ApiResponse<T>
        {
            Success = result.IsSuccess,
            Data = result.Data,
            Message = result.Message,
            Errors = result.Errors
        };

        return result.StatusCode switch
        {
            200 => Ok(response),
            201 => StatusCode(201, response),
            400 => BadRequest(response),
            401 => Unauthorized(response),
            403 => StatusCode(403, response),
            404 => NotFound(response),
            409 => Conflict(response),
            429 => StatusCode(429, response),
            _ => StatusCode(result.StatusCode, response)
        };
    }

    protected IActionResult PagedResult<T>(Result<PagedResult<T>> result)
    {
        if (!result.IsSuccess) return FromResult(result);

        var paged = result.Data!;
        var response = new ApiResponse<IEnumerable<T>>
        {
            Success = true,
            Data = paged.Items,
            Message = result.Message,
            Pagination = new PaginationMeta
            {
                Page = paged.Page,
                PageSize = paged.PageSize,
                TotalCount = paged.TotalCount,
                TotalPages = paged.TotalPages,
                HasNext = paged.HasNext,
                HasPrevious = paged.HasPrevious
            }
        };
        return Ok(response);
    }
}
