###############################################################################
# PROGRAMA: sample.4gl
# CREADO  : 11/03/2026
# VERSION : 1.0.0
# AUTOR   : Test
# OBJETIVO: Archivo de prueba para validar syntax highlighting e IntelliSense
###############################################################################

DATABASE stores

GLOBALS
  DEFINE g_user    CHAR(20)
  DEFINE g_count   INTEGER
  DEFINE g_amount  MONEY(10,2)
  DEFINE g_data    BYTE
  DEFINE g_flag    BOOLEAN
  DEFINE g_big     BIGINT
  DEFINE g_inter   INTERVAL HOUR TO MINUTE
  DEFINE g_dt      DATETIME YEAR TO SECOND
END GLOBALS

MAIN
  DEFER INTERRUPT
  DEFER QUIT
  WHENEVER ERROR CONTINUE
  WHENEVER NOT FOUND CONTINUE

  LET g_user = "admin"

  -- Prueba de CALL con parametros (SignatureHelp deberia funcionar aqui)
  CALL init_program("test", 100)
  CALL process_data(g_user) RETURNING g_count

  IF g_count > 0 THEN
    DISPLAY "Records: ", g_count CLIPPED
  ELSE
    ERROR "No records found"
    SLEEP 2
  END IF

  WHILE g_count > 0
    LET g_count = g_count - 1
  END WHILE

  FOR g_count = 1 TO 100
    DISPLAY g_count
  END FOR

  CASE g_count
    WHEN 0
      DISPLAY "None"
    WHEN 1
      DISPLAY "One"
    OTHERWISE
      DISPLAY "Many: ", g_count USING "###,###"
  END CASE

  # Prueba de operadores
  LET g_amount = (g_count * 10.5) + 20
  LET g_amount = g_count ** 2
  LET g_user = g_user || " suffix"

  IF g_amount IS NULL THEN
    LET g_amount = 0
  END IF

  IF g_user MATCHES "admin*" THEN
    DISPLAY "Admin user"
  END IF

  IF g_count BETWEEN 1 AND 100 THEN
    DISPLAY "In range"
  END IF

  -- Report
  START REPORT order_report TO "output.txt"
  FINISH REPORT order_report

  -- Transacciones
  BEGIN WORK
    INSERT INTO orders VALUES (0, TODAY, 100)
    IF STATUS < 0 THEN
      ROLLBACK WORK
    ELSE
      COMMIT WORK
    END IF

  -- Funciones built-in
  LET g_user = UPSHIFT(g_user)
  LET g_user = DOWNSHIFT(g_user)
  LET g_count = LENGTH(g_user)
  LET g_count = FGL_LASTKEY()
  LET g_user = FGL_GETENV("INFORMIXDIR")
  CALL STARTLOG("errors.log")
  CALL ERRORLOG("Test message")

  DISPLAY TODAY, " ", TIME, " ", CURRENT
  DISPLAY DAY(TODAY), "/", MONTH(TODAY), "/", YEAR(TODAY)
  DISPLAY WEEKDAY(TODAY)
  DISPLAY MDY(3, 11, 2026)
  DISPLAY NVL(g_user, "unknown")
  DISPLAY DECODE(g_count, 0, "zero", 1, "one", "other")

  EXIT PROGRAM
END MAIN

FUNCTION init_program(p_name, p_value)
  DEFINE p_name  CHAR(20)
  DEFINE p_value INTEGER
  DEFINE l_rec   RECORD LIKE customer.*
  DEFINE l_arr   ARRAY[100] OF RECORD
    name    CHAR(30),
    amount  DECIMAL(10,2)
  END RECORD
  DEFINE l_sql   CHAR(500)

  -- Ventanas y formularios
  OPEN WINDOW w1 AT 2,2 WITH 20 ROWS, 78 COLUMNS
    ATTRIBUTE(BORDER, BOLD, BLUE)
  OPEN FORM f1 FROM "customer"
  DISPLAY FORM f1

  -- INPUT BY NAME con eventos
  INPUT BY NAME l_rec.fname, l_rec.lname
    BEFORE INPUT
      DISPLAY "Start input"
    AFTER FIELD fname
      IF l_rec.fname IS NULL THEN
        ERROR "Name is required"
        NEXT FIELD fname
      END IF
    ON KEY (F5)
      CALL SHOWHELP(100)
    AFTER INPUT
      IF INT_FLAG THEN
        LET INT_FLAG = FALSE
        EXIT INPUT
      END IF
  END INPUT

  -- Menu
  MENU "Options"
    COMMAND "Add" "Add new record"
      DISPLAY "Adding..."
    COMMAND "Delete" "Delete record"
      DISPLAY "Deleting..."
    COMMAND "Exit" "Exit menu"
      EXIT MENU
  END MENU

  -- Cursor con FOREACH
  DECLARE c_cust SCROLL CURSOR WITH HOLD FOR
    SELECT customer_num, fname, lname, company
      FROM customer
     WHERE state = "CA"
       AND status IS NOT NULL
     ORDER BY lname ASC

  FOREACH c_cust INTO l_rec.*
    DISPLAY BY NAME l_rec.fname, l_rec.lname
  END FOREACH

  -- Prepared / Dynamic SQL
  LET l_sql = "UPDATE customer SET status = ? WHERE customer_num = ?"
  PREPARE s_upd FROM l_sql
  EXECUTE s_upd USING l_rec.status, l_rec.customer_num
  FREE s_upd

  -- LOAD / UNLOAD
  LOAD FROM "data.unl" INSERT INTO customer
  UNLOAD TO "export.unl"
    SELECT * FROM customer WHERE state = "CA"

  -- Locking
  SET LOCK MODE TO WAIT 10
  SET ISOLATION TO DIRTY READ
  LOCK TABLE customer IN SHARE MODE

  CLOSE FORM f1
  CLOSE WINDOW w1

  RETURN p_value
END FUNCTION

FUNCTION process_data(p_user)
  DEFINE p_user  CHAR(20)
  DEFINE l_count INTEGER

  SELECT COUNT(*) INTO l_count
    FROM customer
   WHERE created_by = p_user

  IF STATUS = NOTFOUND THEN
    LET l_count = 0
  END IF

  RETURN l_count
END FUNCTION

REPORT order_report(r_rec)
  DEFINE r_rec RECORD LIKE orders.*

  OUTPUT
    LEFT MARGIN 0
    TOP MARGIN 2
    BOTTOM MARGIN 2
    PAGE LENGTH 66

  ORDER BY r_rec.customer_num

  FORMAT
    FIRST PAGE HEADER
      PRINT COLUMN 1, "=== ORDER REPORT ==="
      PRINT COLUMN 1, TODAY USING "dd/mm/yyyy"
      SKIP 1 LINES

    PAGE HEADER
      PRINT COLUMN 1, "Customer",
            COLUMN 20, "Order#",
            COLUMN 35, "Date",
            COLUMN 50, "Total"
      PRINT COLUMN 1, "--------",
            COLUMN 20, "------",
            COLUMN 35, "----",
            COLUMN 50, "-----"

    BEFORE GROUP OF r_rec.customer_num
      SKIP 1 LINES
      PRINT "Customer: ", r_rec.customer_num USING "####"

    ON EVERY ROW
      PRINT COLUMN 1, r_rec.customer_num USING "####",
            COLUMN 20, r_rec.order_num USING "#####",
            COLUMN 35, r_rec.order_date USING "dd/mm/yyyy",
            COLUMN 50, r_rec.total USING "$$$,$$$.&&"

    AFTER GROUP OF r_rec.customer_num
      PRINT "  Subtotal: ", GROUP SUM(r_rec.total) USING "$$$,$$$.&&"
      NEED 3 LINES

    ON LAST ROW
      SKIP 2 LINES
      PRINT COLUMN 1, "Grand Total: ", SUM(r_rec.total) USING "$$$,$$$.&&"
      PRINT COLUMN 1, "Total orders: ", COUNT(*)
      PRINT COLUMN 1, "Page ", PAGENO USING "##"

    PAGE TRAILER
      PRINT COLUMN 30, "--- Page ", PAGENO USING "##", " ---"
END REPORT
