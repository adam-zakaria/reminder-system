from langchain.prompts import StringPromptTemplate
from pydantic import BaseModel, Field
from typing import Any, List
import re

class SujendraPromptTemplate(StringPromptTemplate, BaseModel):
    """
    Custom prompt template that handles JSON structures inside the template.
    JSON objects are not considered input variables or partial inputs and should
    remain unchanged during the formatting process.
    """
    
    # Ensure 'template' and 'input_variables' are part of the Pydantic model
    template: str = Field(...)
    input_variables: List[str] = Field(...)

    def __init__(self, template: str, input_variables: List[str], **kwargs: Any):
        # Initialize parent class and set template and input_variables
        super().__init__(input_variables=input_variables, template=template, **kwargs)
        self.template = template

    def manual_format(self, template: str, **kwargs: Any) -> str:
        """
        Manually format the template by replacing only specific placeholders.
        JSON blocks remain untouched.
        """
        for key, value in kwargs.items():
            template = template.replace(f"{{{key}}}", str(value))
        return template

    def format(self, **kwargs: Any) -> str:
        """
        Manually format only specific placeholders, without affecting JSON structures.
        """
        return self.manual_format(self.template, **kwargs)

    @classmethod
    def from_json_template(cls, template: str, input_variables: List[str], **kwargs: Any) -> "SujendraPromptTemplate":
        """
        Class method to create an instance of SujendraPromptTemplate from a given template and input variables.
        """
        return cls(template=template, input_variables=input_variables, **kwargs)
