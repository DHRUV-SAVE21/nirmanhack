import React from 'react';
import styled from 'styled-components';

const Button = ({ children, text, className, as = "button", ...props }) => {
  const Component = as;
  return (
    <StyledWrapper className={className}>
      <Component className="custom-btn" {...props}>
        <span>{children || text}</span>
      </Component>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .custom-btn {
   outline: none;
   cursor: pointer;
   border: 1px solid rgba(34, 197, 94, 0.2);
   padding: 0.9rem 2.2rem;
   margin: 0;
   font-family: inherit;
   position: relative;
   display: inline-flex;
   align-items: center;
   justify-content: center;
   gap: 0.5rem;
   letter-spacing: 0.05rem;
   font-weight: 700;
   font-size: 16px;
   border-radius: 500px;
   overflow: hidden;
   background: white;
   color: white; /* Visible when green background is active */
   transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
   text-decoration: none;
   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .custom-btn span {
   position: relative;
   z-index: 10;
   transition: color 0.4s;
   display: flex;
   align-items: center;
   gap: 0.5rem;
  }

  .custom-btn:hover span {
   color: #166534; /* Dark green text on white when hovered */
  }

  .custom-btn::before {
   content: "";
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background: #22c55e; /* Premium Organic Green */
   z-index: 1;
   transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .custom-btn:hover::before {
   transform: translateX(101%);
  }
  
  .custom-btn:hover {
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.5);
  }
    
  .custom-btn:active {
    transform: scale(0.96);
  }
`;

export default Button;
